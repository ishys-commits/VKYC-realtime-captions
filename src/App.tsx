import { useState } from "react";
import DeleteFileCard, {
  defaultConfig,
  type TossConfig,
} from "./DeleteFileCard";

type Overrides = Partial<TossConfig>;

export default function App() {
  const [cfg, setCfg] = useState<Overrides>({});
  const [log, setLog] = useState<string[]>([]);
  // Remount the card when we change structural settings so it re-lays-out.
  const [key, setKey] = useState(0);

  const merged = { ...defaultConfig, ...cfg };
  const set = <K extends keyof TossConfig>(k: K, v: TossConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  const push = (m: string) =>
    setLog((l) => [`${new Date().toLocaleTimeString()}  ${m}`, ...l].slice(0, 6));

  return (
    <div className="demo">
      <div className="demo-stage">
        <DeleteFileCard
          key={key}
          config={cfg}
          onDelete={() => push("onDelete — file removed")}
          onCancel={() => push("onCancel — kept the file")}
          onMiss={(n) => push(`onMiss — ${n} total`)}
        />
        <div className="demo-events">
          <h3>Events</h3>
          {log.length === 0 ? (
            <p className="muted">Toss the ball into the bin…</p>
          ) : (
            <ul>
              {log.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="panel">
        <div className="panel-head">
          <h3>Settings</h3>
          <button
            className="panel-reset"
            onClick={() => {
              setCfg({});
              setKey((k) => k + 1);
            }}
          >
            Reset
          </button>
        </div>

        <Group title="Feel">
          <Slider label="Speed" min={0.25} max={3} step={0.05} value={merged.speed} onChange={(v) => set("speed", v)} />
          <Slider label="Hit tolerance" min={0} max={80} step={1} value={merged.hitTolerance} onChange={(v) => set("hitTolerance", v)} suffix="px" />
          <Slider label="Throw projection" min={0.02} max={0.4} step={0.01} value={merged.throwProjection} onChange={(v) => set("throwProjection", v)} />
          <Slider label="Throw threshold" min={50} max={800} step={10} value={merged.throwThreshold} onChange={(v) => set("throwThreshold", v)} suffix="px/s" />
          <Slider label="Flick threshold" min={200} max={1400} step={20} value={merged.flickThreshold} onChange={(v) => set("flickThreshold", v)} suffix="px/s" />
        </Group>

        <Group title="Spring (bounce-back)">
          <Slider label="Stiffness" min={80} max={1000} step={10} value={merged.spring.stiffness} onChange={(v) => set("spring", { ...merged.spring, stiffness: v })} />
          <Slider label="Damping" min={5} max={60} step={1} value={merged.spring.damping} onChange={(v) => set("spring", { ...merged.spring, damping: v })} />
        </Group>

        <Group title="Position & size">
          <Slider label="Ball size" min={20} max={60} step={1} value={merged.ballSize} onChange={(v) => set("ballSize", v)} suffix="px" />
          <Slider label="Ball offset →" min={20} max={140} step={2} value={merged.ballOffset.right} onChange={(v) => set("ballOffset", { ...merged.ballOffset, right: v })} suffix="px" />
          <Slider label="Bin offset ←" min={20} max={160} step={2} value={merged.binOffset.left} onChange={(v) => set("binOffset", { ...merged.binOffset, left: v })} suffix="px" />
        </Group>

        <Group title="Miss handling">
          <Slider label="Miss limit" min={1} max={8} step={1} value={merged.missLimit} onChange={(v) => set("missLimit", v)} />
          <Radio
            label="Fallback buttons"
            value={merged.fallback}
            options={[
              ["after-limit", "After limit"],
              ["always", "Always"],
              ["never", "Never"],
            ]}
            onChange={(v) => set("fallback", v as TossConfig["fallback"])}
          />
        </Group>

        <Group title="Copy">
          <Text label="Title" value={merged.title} onChange={(v) => set("title", v)} />
          <Text label="File name" value={merged.fileName} onChange={(v) => set("fileName", v)} />
        </Group>
      </aside>
    </div>
  );
}

/* ---- tiny control widgets ---- */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="group">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function Slider({
  label, min, max, step, value, onChange, suffix,
}: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <label className="ctrl">
      <span className="ctrl-label">
        {label}
        <em>{value}{suffix}</em>
      </span>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

function Radio({
  label, value, options, onChange,
}: {
  label: string; value: string; options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div className="ctrl">
      <span className="ctrl-label">{label}</span>
      <div className="seg">
        {options.map(([v, l]) => (
          <button
            key={v}
            className={v === value ? "on" : ""}
            onClick={() => onChange(v)}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Text({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <label className="ctrl">
      <span className="ctrl-label">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
