import { Fragment } from "react";
import { Stat } from "@/components/charts/Bars";
import {
  CW_DIMENSION_META,
  cwDimensionStats,
  cwOverallScore,
  cwStepStats,
  cwTaskStats,
} from "@/lib/analysis";
import {
  CognitiveWalkthroughConfig,
  CognitiveWalkthroughResult,
  StudyResponse,
} from "@/lib/types";

/** Red → amber → green scale for a 0..100 pass rate. */
function scoreColor(v: number): string {
  if (v >= 80) return "#16a34a";
  if (v >= 60) return "#65a30d";
  if (v >= 40) return "#f59e0b";
  if (v >= 20) return "#ea580c";
  return "#dc2626";
}

function ScoreChip({ v }: { v: number }) {
  return (
    <span
      className="inline-grid place-items-center min-w-[44px] px-2 py-1 rounded-md text-xs font-mono font-semibold text-white tabular-nums"
      style={{ backgroundColor: scoreColor(v) }}
    >
      {v}%
    </span>
  );
}

export default function CognitiveWalkthroughResults({
  config,
  responses,
}: {
  config: CognitiveWalkthroughConfig;
  responses: StudyResponse[];
}) {
  if (responses.length === 0) {
    return (
      <p className="text-ink/50 text-sm">
        No evaluations yet — share the participant link with your evaluators to
        start collecting walkthrough data. Cognitive walkthroughs work well with
        just 3–5 evaluators.
      </p>
    );
  }

  const results = responses.map(
    (r) => r.data as CognitiveWalkthroughResult
  );
  const evaluatorOf = new Map<CognitiveWalkthroughResult, string>(
    results.map((res, i) => [res, responses[i].participant])
  );

  const overall = cwOverallScore(config, results);
  const dimStats = cwDimensionStats(config, results);
  const stepStats = cwStepStats(config, results);
  const taskStats = cwTaskStats(config, results);

  const breakdownSteps = stepStats.filter((s) => s.problemFlags > 0);
  const highSeverity = stepStats.filter(
    (s) => (s.maxSeverity ?? 0) >= 3
  ).length;

  const weakestDim = [...dimStats].sort((a, b) => a.passRate - b.passRate)[0];

  // prioritised problems: by problem rate, then severity
  const ranked = [...breakdownSteps].sort(
    (a, b) =>
      b.problemRate - a.problemRate ||
      (b.avgSeverity ?? 0) - (a.avgSeverity ?? 0)
  );

  // attribute failure stories to participants
  const storiesByStep = new Map<string, { who: string; text: string }[]>();
  for (const res of results) {
    const who = evaluatorOf.get(res) ?? "—";
    for (const t of res.tasks)
      for (const s of t.steps) {
        const text = s.failureStory.trim();
        if (!text) continue;
        const arr = storiesByStep.get(s.stepId) ?? [];
        arr.push({ who, text });
        storiesByStep.set(s.stepId, arr);
      }
  }

  return (
    <div className="space-y-10">
      {/* Headline */}
      <div className="grid sm:grid-cols-4 gap-3">
        <Stat label="Evaluators" value={String(responses.length)} />
        <Stat
          label="Learnability score"
          value={`${overall}%`}
          sub="judgments a new user would pass"
        />
        <Stat
          label="Breakdown steps"
          value={`${breakdownSteps.length}/${stepStats.length}`}
          sub="≥1 evaluator flagged a problem"
        />
        <Stat
          label="High-severity steps"
          value={String(highSeverity)}
          sub="severity 3–4"
        />
      </div>

      {/* What's the weak link — dimension breakdown */}
      <section className="card p-6">
        <h2 className="font-semibold text-ink mb-1">
          Where does learnability break down?
        </h2>
        <p className="text-sm text-ink/50 mb-5 max-w-2xl">
          Every step is judged on the four cognitive dimensions of the
          walkthrough method. The dimension with the lowest pass rate is your
          weak link — it tells you <em>what kind</em> of fix the design needs,
          not just where.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {dimStats.map((d) => {
            const meta = CW_DIMENSION_META[d.dimension];
            const isWeak = weakestDim && d.dimension === weakestDim.dimension;
            return (
              <div
                key={d.dimension}
                className={`rounded-xl border p-4 ${
                  isWeak ? "border-ink bg-ink/[0.03]" : "border-ink/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta.short}
                  </span>
                  {isWeak && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/50">
                      Weak link
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-ink">{meta.label}</p>
                <p className="font-mono text-2xl font-semibold text-ink mt-1 tabular-nums">
                  {d.passRate}%
                </p>
                <div className="h-1.5 rounded-full bg-ink/10 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.passRate}%`,
                      backgroundColor: scoreColor(d.passRate),
                    }}
                  />
                </div>
                <p className="text-[11px] text-ink/45 mt-2">
                  {d.counts.no} no · {d.counts.unsure} unsure · {d.counts.yes} yes
                </p>
              </div>
            );
          })}
        </div>
        {weakestDim && (
          <div className="rounded-xl bg-paper border border-ink/10 p-4">
            <p className="eyebrow mb-1">
              Recommended focus — {CW_DIMENSION_META[weakestDim.dimension].label}
            </p>
            <p className="text-sm text-ink/70 mb-2">
              {CW_DIMENSION_META[weakestDim.dimension].blurb}
            </p>
            <p className="text-sm text-ink">
              <span className="font-semibold">Design lever:</span>{" "}
              {CW_DIMENSION_META[weakestDim.dimension].redesign}
            </p>
          </div>
        )}
      </section>

      {/* Prioritised problems */}
      {ranked.length > 0 && (
        <section className="card p-6">
          <h2 className="font-semibold text-ink mb-1">
            Prioritised problem steps
          </h2>
          <p className="text-sm text-ink/50 mb-5">
            Ranked by how many evaluators flagged a breakdown, then by severity.
            Start at the top.
          </p>
          <ol className="space-y-3">
            {ranked.slice(0, 8).map((s, i) => {
              const dimMeta = s.weakestDimension
                ? CW_DIMENSION_META[s.weakestDimension]
                : null;
              const stories = storiesByStep.get(s.step.id) ?? [];
              return (
                <li
                  key={s.step.id}
                  className="rounded-xl border border-ink/10 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-semibold text-ink/40 mt-1 w-5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink/45">
                        {s.task.text} · Step {s.stepIndex}
                      </p>
                      <p className="text-ink font-medium">{s.step.action}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-ink/55">
                        <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-medium">
                          {s.problemRate}% flagged it ({s.problemFlags}/
                          {s.evaluators})
                        </span>
                        {s.avgSeverity !== null && (
                          <span className="px-2 py-0.5 rounded-md bg-ink/5">
                            avg severity {s.avgSeverity.toFixed(1)}
                          </span>
                        )}
                        {dimMeta && (
                          <span
                            className="px-2 py-0.5 rounded-md text-white font-medium"
                            style={{ backgroundColor: dimMeta.color }}
                          >
                            {dimMeta.label}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-ink/5">
                          {s.agreement}% evaluator agreement
                        </span>
                      </div>
                      {stories.length > 0 && (
                        <details className="mt-2.5 group">
                          <summary className="text-xs text-ink/50 cursor-pointer hover:text-ink list-none">
                            ▸ {stories.length} failure stor
                            {stories.length === 1 ? "y" : "ies"}
                          </summary>
                          <ul className="mt-2 space-y-1.5">
                            {stories.map((st, k) => (
                              <li
                                key={k}
                                className="text-sm text-ink/75 bg-paper rounded-lg px-3 py-2"
                              >
                                <span className="font-mono text-[10px] text-ink/40 mr-2">
                                  {st.who}
                                </span>
                                “{st.text}”
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Per-task learnability */}
      <section className="card p-6">
        <h2 className="font-semibold text-ink mb-4">Learnability by task</h2>
        <div className="space-y-2.5">
          {taskStats.map((t, i) => (
            <div
              key={t.task.id}
              className="grid grid-cols-[1fr_auto] gap-3 items-center"
            >
              <div className="min-w-0">
                <p className="text-sm text-ink truncate">
                  <span className="text-ink/40 font-mono text-xs mr-2">
                    T{i + 1}
                  </span>
                  {t.task.text || "(untitled task)"}
                </p>
                <div className="h-2 rounded-full bg-ink/10 mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${t.passRate}%`,
                      backgroundColor: scoreColor(t.passRate),
                    }}
                  />
                </div>
              </div>
              <div className="text-right">
                <ScoreChip v={t.passRate} />
                <p className="text-[11px] text-ink/40 mt-1">
                  {t.problemSteps}/{t.totalSteps} steps flagged
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Step × question heatmap */}
      <section className="card p-6 overflow-x-auto">
        <h2 className="font-semibold text-ink mb-1">Step-by-step breakdown</h2>
        <p className="text-sm text-ink/50 mb-5">
          Pass rate for each step on each question. Darker red marks the precise
          point a first-time user is predicted to fail.
        </p>
        <table className="w-full text-sm border-separate border-spacing-y-1">
          <thead>
            <tr className="text-left text-xs text-ink/50">
              <th className="py-1 pr-4 font-medium">Step</th>
              {config.questions.map((q, i) => {
                const meta = CW_DIMENSION_META[q.dimension];
                return (
                  <th key={q.id} className="py-1 px-2 font-medium text-center">
                    <span
                      className="inline-block w-6 h-6 leading-6 rounded text-white text-[10px] font-mono"
                      style={{ backgroundColor: meta.color }}
                      title={`${meta.label}: ${q.text}`}
                    >
                      Q{i + 1}
                    </span>
                  </th>
                );
              })}
              <th className="py-1 px-2 font-medium text-center">Flagged</th>
            </tr>
          </thead>
          <tbody>
            {config.tasks.map((task, tIdx) => {
              const rows = stepStats.filter((s) => s.task.id === task.id);
              return (
                <Fragment key={task.id}>
                  <tr>
                    <td
                      colSpan={config.questions.length + 2}
                      className="pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-ink/45"
                    >
                      T{tIdx + 1} · {task.text || "(untitled)"}
                    </td>
                  </tr>
                  {rows.map((s) => (
                    <tr key={s.step.id}>
                      <td className="py-1 pr-4 align-top">
                        <span className="text-ink/40 font-mono text-xs mr-1.5">
                          {s.stepIndex}
                        </span>
                        <span className="text-ink/80">
                          {s.step.action || "(empty step)"}
                        </span>
                      </td>
                      {s.byQuestion.map((q) => {
                        const answered =
                          q.counts.yes + q.counts.no + q.counts.unsure > 0;
                        return (
                          <td key={q.def.id} className="px-2 text-center">
                            {answered ? (
                              <ScoreChip v={q.passRate} />
                            ) : (
                              <span className="text-ink/25">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 text-center text-xs text-ink/55 tabular-nums">
                        {s.problemFlags}/{s.evaluators}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-ink/40 mt-4">
          Scale: yes = pass, unsure = half, no = fail. Hover a column header to
          see the full question.
        </p>
      </section>
    </div>
  );
}
