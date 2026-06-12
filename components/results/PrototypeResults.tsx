import ClickMap from "@/components/charts/ClickMap";
import { OUTCOME_COLORS, Stat, StackedBar } from "@/components/charts/Bars";
import { fmtMs, median } from "@/lib/analysis";
import { PrototypeConfig, PrototypeResult, StudyResponse } from "@/lib/types";

export default function PrototypeResults({
  config,
  responses,
}: {
  config: PrototypeConfig;
  responses: StudyResponse[];
}) {
  const all = responses.flatMap((r) => (r.data as PrototypeResult).tasks);
  const screenName = new Map(config.screens.map((s) => [s.id, s.name]));

  if (responses.length === 0) {
    return (
      <p className="text-ink/50 text-sm">
        No responses yet — share the participant link to start collecting data.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-3 max-w-2xl">
        <Stat label="Participants" value={String(responses.length)} />
        <Stat
          label="Success rate"
          value={`${
            all.length
              ? Math.round(
                  (100 * all.filter((t) => t.outcome === "success").length) /
                    all.length
                )
              : 0
          }%`}
          sub="across all tasks"
        />
        <Stat
          label="Misclick rate"
          value={`${(() => {
            const clicks = all.flatMap((t) => t.clicks);
            return clicks.length
              ? Math.round(
                  (100 * clicks.filter((c) => !c.hitHotspot).length) /
                    clicks.length
                )
              : 0;
          })()}%`}
          sub="clicks outside hotspots"
        />
      </div>

      {config.tasks.map((task, i) => {
        const rs = all.filter((t) => t.taskId === task.id);
        const clicks = rs.flatMap((t) => t.clicks);
        const pathCounts = new Map<string, number>();
        for (const t of rs) {
          const key = t.screenPath
            .map((s) => screenName.get(s) ?? "?")
            .join(" → ");
          pathCounts.set(key, (pathCounts.get(key) ?? 0) + 1);
        }

        return (
          <section key={task.id} className="card p-5">
            <h2 className="font-semibold text-ink mb-4">
              Task {i + 1}: <span className="font-normal">{task.text}</span>
            </h2>

            <div className="grid sm:grid-cols-4 gap-3 mb-4">
              <Stat
                label="Success"
                value={`${
                  rs.length
                    ? Math.round(
                        (100 * rs.filter((t) => t.outcome === "success").length) /
                          rs.length
                      )
                    : 0
                }%`}
              />
              <Stat
                label="Misclicks"
                value={String(clicks.filter((c) => !c.hitHotspot).length)}
              />
              <Stat
                label="Median clicks"
                value={String(median(rs.map((t) => t.clicks.length)))}
              />
              <Stat label="Median time" value={fmtMs(median(rs.map((t) => t.timeMs)))} />
            </div>

            <div className="mb-5">
              <StackedBar
                segments={[
                  {
                    label: "Completed",
                    value: rs.filter((t) => t.outcome === "success").length,
                    color: OUTCOME_COLORS["success"],
                  },
                  {
                    label: "Gave up",
                    value: rs.filter((t) => t.outcome === "gave-up").length,
                    color: OUTCOME_COLORS["gave-up"],
                  },
                ]}
              />
            </div>

            <h3 className="text-sm font-semibold text-ink/75 mb-2">
              Paths taken
            </h3>
            <ul className="space-y-1 mb-6">
              {[...pathCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([path, count]) => (
                  <li key={path} className="text-sm text-ink/60 flex gap-2">
                    <span className="font-semibold text-ink tabular-nums w-8">
                      {count}×
                    </span>
                    <span>{path}</span>
                  </li>
                ))}
            </ul>

            <h3 className="text-sm font-semibold text-ink/75 mb-2">
              Clicks per screen{" "}
              <span className="font-normal text-ink/40">
                (red = missed a hotspot)
              </span>
            </h3>
            <div className="grid md:grid-cols-2 gap-5">
              {config.screens
                .map((screen) => ({
                  screen,
                  screenClicks: clicks.filter((c) => c.screenId === screen.id),
                }))
                .filter((x) => x.screenClicks.length > 0)
                .map(({ screen, screenClicks }) => (
                  <div key={screen.id}>
                    <p className="text-xs font-medium text-ink/60 mb-1">
                      {screen.name}
                    </p>
                    <ClickMap
                      image={screen.image}
                      clicks={screenClicks.map((c) => ({
                        x: c.x,
                        y: c.y,
                        color: c.hitHotspot ? "#16a34a" : "#dc2626",
                        label: c.hitHotspot ? "hotspot click" : "misclick",
                      }))}
                    />
                  </div>
                ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
