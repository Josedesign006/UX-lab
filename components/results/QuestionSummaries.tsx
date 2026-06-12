import { HBarList } from "@/components/charts/Bars";
import { mean } from "@/lib/analysis";
import { Answer, Question } from "@/lib/types";

/** Aggregated charts for a set of questions answered across responses. */
export default function QuestionSummaries({
  questions,
  answerSets,
}: {
  questions: Question[];
  answerSets: Answer[][];
}) {
  if (questions.length === 0) return null;
  return (
    <div className="space-y-5">
      {questions.map((q, i) => {
        const values = answerSets
          .map((set) => set.find((a) => a.questionId === q.id)?.value)
          .filter((v): v is string | string[] | number => v !== undefined);
        return (
          <div key={q.id} className="card p-5">
            <p className="font-medium text-ink mb-3">
              {i + 1}. {q.text}{" "}
              <span className="text-xs text-ink/40 font-normal">
                ({values.length} answer{values.length === 1 ? "" : "s"})
              </span>
            </p>
            <QSummary q={q} values={values} />
          </div>
        );
      })}
    </div>
  );
}

function QSummary({
  q,
  values,
}: {
  q: Question;
  values: (string | string[] | number)[];
}) {
  if (values.length === 0)
    return <p className="text-sm text-ink/40">No answers yet.</p>;

  switch (q.type) {
    case "single-choice":
    case "multi-choice": {
      const counts = new Map<string, number>();
      for (const opt of q.options) counts.set(opt, 0);
      for (const v of values) {
        const arr = Array.isArray(v) ? v : [v as string];
        for (const x of arr) counts.set(String(x), (counts.get(String(x)) ?? 0) + 1);
      }
      return (
        <HBarList
          items={[...counts.entries()].map(([label, value]) => ({ label, value }))}
        />
      );
    }
    case "likert":
    case "rating": {
      const n = q.scaleSize ?? 5;
      const counts = Array.from({ length: n }, () => 0);
      const nums = values.map(Number).filter((x) => !isNaN(x));
      for (const v of nums) if (v >= 1 && v <= n) counts[v - 1]++;
      return (
        <div>
          <p className="text-sm text-ink/60 mb-2">
            Average: <strong>{mean(nums).toFixed(1)}</strong> / {n}
            {q.minLabel || q.maxLabel ? (
              <span className="text-xs text-ink/40">
                {" "}
                (1 = {q.minLabel || "low"}, {n} = {q.maxLabel || "high"})
              </span>
            ) : null}
          </p>
          <HBarList
            items={counts.map((value, i) => ({ label: String(i + 1), value }))}
          />
        </div>
      );
    }
    case "number": {
      const nums = values.map(Number).filter((x) => !isNaN(x));
      const sorted = [...nums].sort((a, b) => a - b);
      return (
        <p className="text-sm text-ink/60">
          Mean <strong>{mean(nums).toFixed(1)}</strong> · Median{" "}
          <strong>{sorted[Math.floor(sorted.length / 2)] ?? 0}</strong> · Min{" "}
          {sorted[0] ?? 0} · Max {sorted[sorted.length - 1] ?? 0}
        </p>
      );
    }
    case "ranking": {
      // average rank position per option (1 = best)
      const sums = new Map<string, { total: number; count: number }>();
      for (const v of values) {
        if (!Array.isArray(v)) continue;
        v.forEach((opt, idx) => {
          const e = sums.get(opt) ?? { total: 0, count: 0 };
          e.total += idx + 1;
          e.count++;
          sums.set(opt, e);
        });
      }
      const rows = [...sums.entries()]
        .map(([label, { total, count }]) => ({
          label,
          avg: total / count,
        }))
        .sort((a, b) => a.avg - b.avg);
      return (
        <HBarList
          items={rows.map((r) => ({
            label: r.label,
            value: Number(r.avg.toFixed(1)),
          }))}
          max={q.options.length}
          unit=""
        />
      );
    }
    default:
      return (
        <ul className="space-y-1.5 max-h-56 overflow-y-auto">
          {values.map((v, i) => (
            <li
              key={i}
              className="text-sm text-ink/75 bg-paper rounded-lg px-3 py-2"
            >
              {String(v)}
            </li>
          ))}
        </ul>
      );
  }
}
