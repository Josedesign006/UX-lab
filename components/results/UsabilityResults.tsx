import { OUTCOME_COLORS, Stat, StackedBar } from "@/components/charts/Bars";
import { fmtMs, mean, median } from "@/lib/analysis";
import { StudyResponse, UsabilityConfig, UsabilityResult } from "@/lib/types";

export default function UsabilityResults({
  config,
  responses,
}: {
  config: UsabilityConfig;
  responses: StudyResponse[];
}) {
  const all = responses.flatMap((r) => (r.data as UsabilityResult).tasks);

  if (responses.length === 0) {
    return (
      <p className="text-ink/50 text-sm">
        No responses yet — share the participant link to start collecting data.
      </p>
    );
  }

  const attempted = all.filter((t) => t.completion !== "skipped");
  const successRate = attempted.length
    ? Math.round(
        (100 * attempted.filter((t) => t.completion === "success").length) /
          attempted.length
      )
    : 0;
  const difficulties = all
    .map((t) => t.difficulty)
    .filter((d): d is number => d !== null);

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-4 gap-3">
        <Stat label="Participants" value={String(responses.length)} />
        <Stat label="Task success" value={`${successRate}%`} sub="fully completed" />
        <Stat
          label="Avg ease (SEQ)"
          value={difficulties.length ? `${mean(difficulties).toFixed(1)}/7` : "—"}
          sub="7 = very easy"
        />
        <Stat
          label="Median study time"
          value={fmtMs(median(responses.map((r) => r.durationMs)))}
        />
      </div>

      {config.tasks.map((task, i) => {
        const rs = all.filter((t) => t.taskId === task.id);
        const diffs = rs
          .map((t) => t.difficulty)
          .filter((d): d is number => d !== null);
        const comments = rs.filter((t) => t.comment.trim());

        return (
          <section key={task.id} className="card p-5">
            <h2 className="font-semibold text-ink mb-4">
              Task {i + 1}: <span className="font-normal">{task.text}</span>
            </h2>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <Stat
                label="Median time on task"
                value={fmtMs(median(rs.map((t) => t.timeMs)))}
              />
              <Stat
                label="Avg ease"
                value={diffs.length ? `${mean(diffs).toFixed(1)}/7` : "—"}
              />
              <Stat label="Attempts" value={String(rs.length)} />
            </div>
            <StackedBar
              segments={[
                {
                  label: "Success",
                  value: rs.filter((t) => t.completion === "success").length,
                  color: OUTCOME_COLORS["success"],
                },
                {
                  label: "Partial",
                  value: rs.filter((t) => t.completion === "partial").length,
                  color: OUTCOME_COLORS["partial"],
                },
                {
                  label: "Fail",
                  value: rs.filter((t) => t.completion === "fail").length,
                  color: OUTCOME_COLORS["fail"],
                },
                {
                  label: "Skipped",
                  value: rs.filter((t) => t.completion === "skipped").length,
                  color: OUTCOME_COLORS["skipped"],
                },
              ]}
            />
            {comments.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-ink/75 mb-2">
                  Comments
                </h3>
                <ul className="space-y-1.5">
                  {comments.map((t, k) => (
                    <li
                      key={k}
                      className="text-sm text-ink/75 bg-paper rounded-lg px-3 py-2"
                    >
                      “{t.comment}”
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
