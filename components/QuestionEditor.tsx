"use client";

import { Question, QuestionType } from "@/lib/types";

const TYPE_LABELS: Record<QuestionType, string> = {
  "short-text": "Short text",
  "long-text": "Long text",
  "single-choice": "Single choice",
  "multi-choice": "Multiple choice",
  likert: "Likert scale",
  rating: "Rating",
  ranking: "Ranking",
  number: "Number",
};

function newId() {
  return "q" + Math.random().toString(36).slice(2, 10);
}

export function newQuestion(type: QuestionType = "short-text"): Question {
  return {
    id: newId(),
    type,
    text: "",
    required: false,
    options:
      type === "single-choice" || type === "multi-choice" || type === "ranking"
        ? ["Option 1", "Option 2"]
        : [],
    scaleSize: type === "likert" ? 5 : type === "rating" ? 5 : undefined,
    minLabel: type === "likert" ? "Strongly disagree" : "",
    maxLabel: type === "likert" ? "Strongly agree" : "",
  };
}

const hasOptions = (t: QuestionType) =>
  t === "single-choice" || t === "multi-choice" || t === "ranking";
const hasScale = (t: QuestionType) => t === "likert" || t === "rating";

export default function QuestionEditor({
  questions,
  onChange,
  emptyHint,
}: {
  questions: Question[];
  onChange: (qs: Question[]) => void;
  emptyHint?: string;
}) {
  const update = (i: number, patch: Partial<Question>) => {
    const qs = [...questions];
    qs[i] = { ...qs[i], ...patch };
    onChange(qs);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const qs = [...questions];
    [qs[i], qs[j]] = [qs[j], qs[i]];
    onChange(qs);
  };

  return (
    <div className="space-y-4">
      {questions.length === 0 && (
        <p className="text-sm text-ink/50">{emptyHint ?? "No questions yet."}</p>
      )}
      {questions.map((q, i) => (
        <div key={q.id} className="card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="mt-2 text-xs font-semibold text-ink/40 w-6">
              Q{i + 1}
            </span>
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Question text"
                  value={q.text}
                  onChange={(e) => update(i, { text: e.target.value })}
                />
                <select
                  className="input !w-44"
                  value={q.type}
                  onChange={(e) => {
                    const type = e.target.value as QuestionType;
                    const fresh = newQuestion(type);
                    update(i, {
                      type,
                      options: hasOptions(type)
                        ? q.options.length
                          ? q.options
                          : fresh.options
                        : [],
                      scaleSize: fresh.scaleSize,
                      minLabel: q.minLabel || fresh.minLabel,
                      maxLabel: q.maxLabel || fresh.maxLabel,
                    });
                  }}
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {hasOptions(q.type) && (
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex gap-2 items-center">
                      <input
                        className="input"
                        value={opt}
                        onChange={(e) => {
                          const options = [...q.options];
                          options[oi] = e.target.value;
                          update(i, { options });
                        }}
                      />
                      <button
                        className="text-ink/40 hover:text-red-500 text-lg px-1"
                        onClick={() =>
                          update(i, { options: q.options.filter((_, k) => k !== oi) })
                        }
                        title="Remove option"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    className="text-sm text-accent hover:underline"
                    onClick={() =>
                      update(i, {
                        options: [...q.options, `Option ${q.options.length + 1}`],
                      })
                    }
                  >
                    + Add option
                  </button>
                </div>
              )}

              {hasScale(q.type) && (
                <div className="flex gap-2 items-center">
                  <select
                    className="input !w-28"
                    value={q.scaleSize ?? 5}
                    onChange={(e) => update(i, { scaleSize: Number(e.target.value) })}
                  >
                    {(q.type === "likert" ? [5, 7] : [5, 7, 10]).map((n) => (
                      <option key={n} value={n}>
                        1 – {n}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    placeholder="Low label (e.g. Strongly disagree)"
                    value={q.minLabel ?? ""}
                    onChange={(e) => update(i, { minLabel: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="High label (e.g. Strongly agree)"
                    value={q.maxLabel ?? ""}
                    onChange={(e) => update(i, { maxLabel: e.target.value })}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-ink/60">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => update(i, { required: e.target.checked })}
                />
                Required
              </label>
            </div>
            <div className="flex flex-col gap-1 text-ink/40">
              <button onClick={() => move(i, -1)} title="Move up" className="hover:text-ink/75">↑</button>
              <button onClick={() => move(i, 1)} title="Move down" className="hover:text-ink/75">↓</button>
              <button
                onClick={() => onChange(questions.filter((_, k) => k !== i))}
                title="Delete"
                className="hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        className="btn-secondary"
        onClick={() => onChange([...questions, newQuestion()])}
      >
        + Add question
      </button>
    </div>
  );
}
