import {
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 *  Config
 * ------------------------------------------------------------------ */

/**
 * Everything you can tune about the toss-to-delete card.
 * Pass a partial `config` prop — anything you omit falls back to
 * `defaultConfig` below.
 */
export interface TossConfig {
  /* ---- copy ---- */
  title: string;
  /** File name shown in the description + used in the sentence. */
  fileName: string;
  /** `{file}` is replaced with `fileName`. */
  description: string;
  /** Hint line at the bottom-left. */
  hint: string;
  /** Hint shown after a miss. `{n}` is replaced with the miss count. */
  missHint: string;
  deletedTitle: string;
  deletedDescription: string;

  /* ---- layout / position ---- */
  /** Ball diameter in px. */
  ballSize: number;
  /** Ball resting position, measured from the card's right / vertical center. */
  ballOffset: { right: number; y: number };
  /** Bin position, measured from the card's left / vertical center. */
  binOffset: { left: number; y: number };
  /** Bin footprint in px (used for the drawing + hit box). */
  binSize: { width: number; height: number };

  /* ---- feel / physics ---- */
  /** Global speed multiplier. 1 = default, 2 = twice as fast, 0.5 = slow-mo. */
  speed: number;
  /** How forgiving the bin target is, in px added around the bin mouth. */
  hitTolerance: number;
  /**
   * How far (ms of flight) the release velocity is projected forward to
   * decide where the ball "lands". Bigger = a gentle flick carries further.
   */
  throwProjection: number;
  /** Min release speed (px/s) that counts as a deliberate throw vs. a nudge. */
  throwThreshold: number;
  /** Upward speed (px/s) that always reads as a "flick up & toss" success. */
  flickThreshold: number;
  /** Spring used for the bounce-back on a miss and the settle on grab. */
  spring: { stiffness: number; damping: number };

  /* ---- miss handling ---- */
  /** After this many misses, reveal the plain Delete / Cancel buttons. */
  missLimit: number;
  /** When the fallback buttons appear. */
  fallback: "after-limit" | "always" | "never";
}

export const defaultConfig: TossConfig = {
  title: "Delete this file?",
  fileName: "Mockup_V2.png",
  description: "Crumple {file} and toss it into the bin.",
  hint: "Flick up, or drop it straight in.",
  missHint: "Missed — give it another toss. ({n})",
  deletedTitle: "Gone.",
  deletedDescription: "{file} is in the bin.",

  ballSize: 34,
  ballOffset: { right: 70, y: 6 },
  binOffset: { left: 96, y: 4 },
  binSize: { width: 70, height: 82 },

  speed: 1,
  hitTolerance: 26,
  throwProjection: 0.14,
  throwThreshold: 260,
  flickThreshold: 620,
  spring: { stiffness: 520, damping: 30 },

  missLimit: 3,
  fallback: "after-limit",
};

/* ------------------------------------------------------------------ *
 *  Props
 * ------------------------------------------------------------------ */

export interface DeleteFileCardProps {
  config?: Partial<TossConfig>;
  onDelete?: () => void;
  onCancel?: () => void;
  /** Fires every time a throw misses, with the running total. */
  onMiss?: (missCount: number) => void;
}

type Status = "idle" | "flying" | "deleted" | "cancelled";

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

const centerOf = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

function pointInRect(
  p: { x: number; y: number },
  r: DOMRect,
  pad: number
): boolean {
  return (
    p.x >= r.left - pad &&
    p.x <= r.right + pad &&
    p.y >= r.top - pad &&
    p.y <= r.bottom + pad
  );
}

/* ------------------------------------------------------------------ *
 *  Component
 * ------------------------------------------------------------------ */

export default function DeleteFileCard({
  config,
  onDelete,
  onCancel,
  onMiss,
}: DeleteFileCardProps) {
  const cfg = useMemo(() => ({ ...defaultConfig, ...config }), [config]);
  const prefersReduced = useReducedMotion();

  const [status, setStatus] = useState<Status>("idle");
  const [misses, setMisses] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Bin reacts when it catches something.
  const [binState, setBinState] = useState<"rest" | "gulp">("rest");

  const cardRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const binRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ball = useAnimationControls();

  // A throw / settle duration that respects the global speed knob.
  const dur = (base: number) => base / Math.max(cfg.speed, 0.05);

  const showFallback =
    cfg.fallback === "always" ||
    prefersReduced ||
    (cfg.fallback === "after-limit" && misses >= cfg.missLimit);

  /* ---- outcomes ---- */

  const succeed = useCallback(async () => {
    setStatus("flying");
    const ballRect = ballRef.current?.getBoundingClientRect();
    const binRect = binRef.current?.getBoundingClientRect();
    if (!ballRect || !binRect) return;

    // Convert bin-center (screen space) into the ball's local x/y offset.
    const ballCenter = centerOf(ballRect);
    const homeX = ballCenter.x - x.get();
    const homeY = ballCenter.y - y.get();
    const targetX = binRect.left + binRect.width / 2 - homeX;
    const targetY = binRect.top + binRect.height * 0.32 - homeY;

    // Arc up first, then drop in — the classic toss.
    const peakY = Math.min(y.get(), targetY) - 46;

    setBinState("gulp");
    await ball.start({
      x: targetX,
      y: [y.get(), peakY, targetY],
      rotate: [0, -160],
      scale: [1, 1, 0.25],
      opacity: [1, 1, 0],
      transition: { duration: dur(0.5), ease: "easeIn", times: [0, 0.45, 1] },
    });

    setStatus("deleted");
    onDelete?.();
    window.setTimeout(() => setBinState("rest"), dur(220));
  }, [ball, x, y, onDelete, cfg.speed]);

  const miss = useCallback(async () => {
    const next = misses + 1;
    setMisses(next);
    onMiss?.(next);
    // Snap home with a little shake of frustration.
    await ball.start({
      x: 0,
      y: 0,
      rotate: [null, -8, 8, 0] as number[],
      scale: 1,
      opacity: 1,
      transition: { type: "spring", ...cfg.spring },
    });
    setStatus("idle");
  }, [ball, misses, onMiss, cfg.spring]);

  /* ---- drag lifecycle ---- */

  const handleDragEnd = useCallback(
    (_e: unknown, info: PanInfo) => {
      setDragging(false);
      const ballRect = ballRef.current?.getBoundingClientRect();
      const binRect = binRef.current?.getBoundingClientRect();
      if (!ballRect || !binRect) return;

      const v = info.velocity;
      const speed = Math.hypot(v.x, v.y);
      const ballCenter = centerOf(ballRect);

      // Where the ball would land if it kept flying at this velocity.
      const projected = {
        x: ballCenter.x + v.x * cfg.throwProjection,
        y: ballCenter.y + v.y * cfg.throwProjection,
      };

      const droppedIn = pointInRect(ballCenter, binRect, cfg.hitTolerance);
      const thrownIn =
        speed > cfg.throwThreshold &&
        pointInRect(projected, binRect, cfg.hitTolerance);
      // A hard upward flick reads as an intentional "toss it" — honour it.
      const flickedUp =
        -v.y > cfg.flickThreshold && projected.x > binRect.left - cfg.hitTolerance;

      if (droppedIn || thrownIn || flickedUp) {
        void succeed();
        return;
      }

      // Was this even a real attempt? A tiny release near home isn't a miss.
      const movedFar = Math.hypot(x.get(), y.get()) > cfg.ballSize;
      if (movedFar || speed > cfg.throwThreshold) {
        void miss();
      } else {
        void ball.start({
          x: 0,
          y: 0,
          transition: { type: "spring", ...cfg.spring },
        });
      }
    },
    [ball, x, y, succeed, miss, cfg]
  );

  /* ---- keyboard throw (accessibility) ---- */

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (status !== "idle") return;
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        void succeed();
      }
    },
    [status, succeed]
  );

  const cancel = useCallback(() => {
    setStatus("cancelled");
    onCancel?.();
  }, [onCancel]);

  const reset = useCallback(() => {
    setStatus("idle");
    setMisses(0);
    x.set(0);
    y.set(0);
    ball.set({ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 });
  }, [ball, x, y]);

  /* ---- derived copy ---- */

  const fill = (s: string) =>
    s.replace("{file}", cfg.fileName).replace("{n}", String(misses));

  const done = status === "deleted" || status === "cancelled";

  /* ------------------------------------------------------------------ */

  return (
    <div className="toss-card" ref={cardRef} data-status={status}>
      {done ? (
        <div className="toss-done">
          <h2>{status === "deleted" ? cfg.deletedTitle : "Kept."}</h2>
          <p>
            {status === "deleted"
              ? fill(cfg.deletedDescription)
              : `${cfg.fileName} is safe.`}
          </p>
          <button className="toss-link" onClick={reset}>
            Reset demo
          </button>
        </div>
      ) : (
        <>
          <header className="toss-head">
            <h2>{cfg.title}</h2>
            <p>{fill(cfg.description)}</p>
          </header>

          <div className="toss-stage">
            {/* Bin */}
            <div
              className="toss-bin"
              ref={binRef}
              data-bin={binState}
              style={{
                left: cfg.binOffset.left,
                marginTop: cfg.binOffset.y,
                width: cfg.binSize.width,
                height: cfg.binSize.height,
              }}
              aria-hidden
            >
              <span className="toss-bin-lid" />
              <span className="toss-bin-body" />
            </div>

            {/* Ball / crumpled file */}
            <motion.button
                ref={ballRef}
                type="button"
                className="toss-ball"
                aria-label={`Toss ${cfg.fileName} into the bin to delete it. Press Enter or the up arrow to throw.`}
                style={{
                  x,
                  y,
                  right: cfg.ballOffset.right,
                  marginTop: cfg.ballOffset.y,
                  width: cfg.ballSize,
                  height: cfg.ballSize,
                }}
                animate={ball}
                drag={!prefersReduced && status === "idle"}
                dragMomentum={false}
                dragElastic={0.9}
                onDragStart={() => setDragging(true)}
                onDragEnd={handleDragEnd}
                onKeyDown={handleKey}
                whileTap={{ scale: 1.12 }}
                data-dragging={dragging}
              />
          </div>

          <footer className="toss-foot">
            <span className="toss-hint">
              {misses > 0 ? fill(cfg.missHint) : cfg.hint}
            </span>
            <span className="toss-misses">
              {misses} {misses === 1 ? "miss" : "misses"}
            </span>
          </footer>

          {showFallback && (
            <div className="toss-fallback">
              <button className="toss-btn ghost" onClick={cancel}>
                Cancel
              </button>
              <button className="toss-btn danger" onClick={() => void succeed()}>
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
