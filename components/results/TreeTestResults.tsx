import {
  OUTCOME_COLORS,
  OUTCOME_LABELS,
  Stat,
  StackedBar,
  HBarList,
} from "@/components/charts/Bars";
import PieTree from "@/components/charts/PieTree";
import {
  fmtMs,
  mean,
  median,
  nodePathLabel,
  pathVisitCounts,
  treeTaskStats,
} from "@/lib/analysis";
import {
  StudyResponse,
  TreeTaskOutcome,
  TreeTestConfig,
  TreeTestResult,
} from "@/lib/types";

const OUTCOMES: TreeTaskOutcome[] = [
  "direct-success",
  "indirect-success",
  "direct-fail",
  "indirect-fail",
  "skipped",
];

export default function TreeTestResults({
  config,
  responses,
}: {
  config: TreeTestConfig;
  responses: StudyResponse[];
}) {
  const allTaskResults = responses.flatMap(
    (r) => (r.data as TreeTestResult).tasks
  );
  const stats = treeTaskStats(config, allTaskResults);

  if (responses.length === 0) {
    return (
      <p className="text-ink/50 text-sm">
        No responses yet — share the participant link to start collecting data.
      </p>
    );
  }

  const overallSuccess = Math.round(
    mean([...stats.values()].map((s) => s.successRate))
  );
  const overallDirect = Math.round(
    mean([...stats.values()].map((s) => s.directnessRate))
  );

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-4 gap-3">
        <Stat label="Participants" value={String(responses.length)} />
        <Stat
          label="Overall success"
          value={`${overallSuccess}%`}
          sub="average across tasks"
        />
        <Stat
          label="Overall directness"
          value={`${overallDirect}%`}
          sub="no backtracking"
        />
        <Stat
          label="Median time"
          value={fmtMs(median(responses.map((r) => r.durationMs)))}
          sub="whole study"
        />
      </div>

      {config.tasks.map((task, i) => {
        const s = stats.get(task.id)!;
        const taskResults = allTaskResults.filter((t) => t.taskId === task.id);
        const outcomeCounts = OUTCOMES.map((o) => ({
          label: OUTCOME_LABELS[o],
          value: taskResults.filter((t) => t.outcome === o).length,
          color: OUTCOME_COLORS[o],
        }));

        return (
          <section key={task.id} className="card p-5">
            <h2 className="font-semibold text-ink">
              Task {i + 1}: <span className="font-normal">{task.text}</span>
            </h2>
            <p className="text-xs text-ink/40 mt-1 mb-4">
              Correct:{" "}
              {task.correctNodeIds
                .map((id) => nodePathLabel(config.tree, id))
                .join("  ·  ") || "—"}
            </p>

            <div className="grid sm:grid-cols-4 gap-3 mb-4">
              <Stat label="Success" value={`${s.successRate}%`} />
              <Stat label="Directness" value={`${s.directnessRate}%`} />
              <Stat label="Direct success" value={`${s.directSuccessRate}%`} />
              <Stat label="Median time" value={fmtMs(s.medianTimeMs)} />
            </div>

            <div className="mb-5">
              <StackedBar segments={outcomeCounts} />
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-ink/75 mb-2">
                Path visualization (pietree)
              </h3>
              <PieTree
                tree={config.tree}
                visits={pathVisitCounts(taskResults)}
                destinations={s.destinations}
                correctIds={task.correctNodeIds}
                total={taskResults.length}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-ink/75 mb-2">
                  Where participants ended up
                </h3>
                <DestinationList
                  config={config}
                  destinations={s.destinations}
                  correctIds={task.correctNodeIds}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink/75 mb-2">
                  First clicks
                </h3>
                <HBarList
                  items={[...s.firstClicks.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([id, value]) => ({
                      label: nodePathLabel(config.tree, id).split(" › ").pop() ?? "?",
                      value,
                    }))}
                />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DestinationList({
  config,
  destinations,
  correctIds,
}: {
  config: TreeTestConfig;
  destinations: Map<string, number>;
  correctIds: string[];
}) {
  const rows = [...destinations.entries()].sort((a, b) => b[1] - a[1]);
  if (!rows.length) return <p className="text-sm text-ink/40">No answers.</p>;
  return (
    <ul className="space-y-1.5">
      {rows.map(([id, count]) => {
        const correct = correctIds.includes(id);
        return (
          <li key={id} className="flex items-center gap-2 text-sm">
            <span
              className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold shrink-0 ${
                correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}
            >
              {correct ? "✓" : "✗"}
            </span>
            <span className="text-ink/75 flex-1">
              {nodePathLabel(config.tree, id)}
            </span>
            <span className="text-ink/50 tabular-nums">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}
