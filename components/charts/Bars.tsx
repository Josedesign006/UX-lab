/** Simple horizontal bar list. */
export function HBarList({
  items,
  max,
  unit = "",
}: {
  items: { label: string; value: number; color?: string; hint?: string }[];
  max?: number;
  unit?: string;
}) {
  const m = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-[minmax(80px,220px)_1fr_48px] gap-2 items-center text-sm">
          <span className="text-ink/75 truncate" title={item.label}>
            {item.label}
          </span>
          <div className="bg-ink/5 rounded h-5 overflow-hidden">
            <div
              className="h-full rounded"
              style={{
                width: `${Math.min(100, (item.value / m) * 100)}%`,
                backgroundColor: item.color ?? "#101010",
              }}
            />
          </div>
          <span className="text-ink/60 tabular-nums text-xs" title={item.hint}>
            {item.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export const OUTCOME_COLORS: Record<string, string> = {
  "direct-success": "#16a34a",
  "indirect-success": "#86efac",
  "direct-fail": "#dc2626",
  "indirect-fail": "#fca5a5",
  skipped: "#cbd5e1",
  success: "#16a34a",
  partial: "#facc15",
  fail: "#dc2626",
  "gave-up": "#cbd5e1",
};

export const OUTCOME_LABELS: Record<string, string> = {
  "direct-success": "Direct success",
  "indirect-success": "Indirect success",
  "direct-fail": "Direct fail",
  "indirect-fail": "Indirect fail",
  skipped: "Skipped",
};

/** Single stacked horizontal bar of outcome segments. */
export function StackedBar({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div>
      <div className="flex h-6 rounded-lg overflow-hidden bg-ink/5">
        {segments
          .filter((s) => s.value > 0)
          .map((s, i) => (
            <div
              key={i}
              className="h-full grid place-items-center text-[10px] font-semibold text-white"
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
              title={`${s.label}: ${s.value} (${Math.round((100 * s.value) / total)}%)`}
            >
              {s.value / total > 0.08 ? s.value : ""}
            </div>
          ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
        {segments.map((s, i) => (
          <span key={i} className="flex items-center gap-1 text-xs text-ink/50">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label} ({s.value})
          </span>
        ))}
      </div>
    </div>
  );
}

/** Big metric tile. */
export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <p className="eyebrow">{label}</p>
      <p className="font-mono text-3xl font-semibold text-ink mt-2 tabular-nums tracking-tight">
        {value}
      </p>
      {sub && <p className="text-xs text-ink/40 mt-1">{sub}</p>}
    </div>
  );
}
