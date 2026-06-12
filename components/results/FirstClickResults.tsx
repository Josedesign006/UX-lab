import ClickMap from "@/components/charts/ClickMap";
import { Stat } from "@/components/charts/Bars";
import { fmtMs, median } from "@/lib/analysis";
import { FirstClickConfig, FirstClickResult, StudyResponse } from "@/lib/types";

export default function FirstClickResults({
  config,
  responses,
}: {
  config: FirstClickConfig;
  responses: StudyResponse[];
}) {
  const all = responses.flatMap((r) => (r.data as FirstClickResult).tasks);

  if (responses.length === 0) {
    return (
      <p className="text-ink/50 text-sm">
        No responses yet — share the participant link to start collecting data.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 gap-3 max-w-md">
        <Stat label="Participants" value={String(responses.length)} />
        <Stat
          label="Median time to click"
          value={fmtMs(median(all.map((t) => t.timeMs)))}
          sub="across all tasks"
        />
      </div>

      {config.tasks.map((task, i) => {
        const clicks = all.filter((t) => t.taskId === task.id);
        return (
          <section key={task.id} className="card p-5">
            <h2 className="font-semibold text-ink mb-1">
              Task {i + 1}: <span className="font-normal">{task.instruction}</span>
            </h2>
            <p className="text-sm text-ink/50 mb-4">
              {clicks.length} click{clicks.length === 1 ? "" : "s"} · median time{" "}
              {fmtMs(median(clicks.map((c) => c.timeMs)))}
            </p>
            {task.image ? (
              <ClickMap
                image={task.image}
                clicks={clicks.map((c) => ({
                  x: c.x,
                  y: c.y,
                  label: `${fmtMs(c.timeMs)}`,
                }))}
              />
            ) : (
              <p className="text-sm text-ink/40">No image configured.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
