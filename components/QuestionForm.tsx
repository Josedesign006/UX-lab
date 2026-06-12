"use client";

import { useState } from "react";
import { Answer, Question } from "@/lib/types";

/** Renders a list of questions and collects answers. */
export default function QuestionForm({
  questions,
  submitLabel = "Continue",
  onSubmit,
}: {
  questions: Question[];
  submitLabel?: string;
  onSubmit: (answers: Answer[]) => void;
}) {
  const [values, setValues] = useState<Record<string, string | string[] | number>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (qid: string, v: string | string[] | number) =>
    setValues((prev) => ({ ...prev, [qid]: v }));

  const submit = () => {
    for (const q of questions) {
      if (!q.required) continue;
      const v = values[q.id];
      const empty =
        v === undefined ||
        v === "" ||
        (Array.isArray(v) && v.length === 0);
      if (empty) {
        setError(`Please answer: “${q.text}”`);
        return;
      }
    }
    const answers: Answer[] = questions
      .filter((q) => values[q.id] !== undefined && values[q.id] !== "")
      .map((q) => ({ questionId: q.id, value: values[q.id] }));
    onSubmit(answers);
  };

  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <div key={q.id} className="space-y-2">
          <p className="font-medium text-ink">
            {i + 1}. {q.text}
            {q.required && <span className="text-red-500"> *</span>}
          </p>
          <QuestionInput q={q} value={values[q.id]} onChange={(v) => set(q.id, v)} />
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary" onClick={submit}>
        {submitLabel}
      </button>
    </div>
  );
}

function QuestionInput({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: string | string[] | number | undefined;
  onChange: (v: string | string[] | number) => void;
}) {
  switch (q.type) {
    case "short-text":
      return (
        <input
          className="input max-w-md"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "long-text":
      return (
        <textarea
          className="input min-h-24"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <input
          type="number"
          className="input max-w-40"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "single-choice":
      return (
        <div className="space-y-1.5">
          {q.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-ink/75">
              <input
                type="radio"
                name={q.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    case "multi-choice": {
      const arr = (value as string[]) ?? [];
      return (
        <div className="space-y-1.5">
          {q.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-ink/75">
              <input
                type="checkbox"
                checked={arr.includes(opt)}
                onChange={(e) =>
                  onChange(
                    e.target.checked ? [...arr, opt] : arr.filter((x) => x !== opt)
                  )
                }
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }
    case "likert":
    case "rating": {
      const n = q.scaleSize ?? 5;
      return (
        <div>
          <div className="flex gap-1.5 flex-wrap items-center">
            {Array.from({ length: n }, (_, i) => i + 1).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                  value === v
                    ? "bg-ink text-white border-ink"
                    : "bg-white border-ink/20 text-ink/75 hover:border-ink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {(q.minLabel || q.maxLabel) && (
            <div
              className="flex justify-between text-xs text-ink/50 mt-1"
              style={{ maxWidth: n * 46 }}
            >
              <span>{q.minLabel}</span>
              <span>{q.maxLabel}</span>
            </div>
          )}
        </div>
      );
    }
    case "ranking": {
      const order = (value as string[]) ?? q.options;
      const move = (i: number, dir: -1 | 1) => {
        const j = i + dir;
        if (j < 0 || j >= order.length) return;
        const next = [...order];
        [next[i], next[j]] = [next[j], next[i]];
        onChange(next);
      };
      return (
        <div className="space-y-1.5 max-w-md">
          <p className="text-xs text-ink/50">Use the arrows to rank (1 = highest).</p>
          {order.map((opt, i) => (
            <div
              key={opt}
              className="flex items-center gap-2 bg-white border border-ink/10 rounded-lg px-3 py-2 text-sm"
            >
              <span className="text-ink/40 font-semibold w-5">{i + 1}.</span>
              <span className="flex-1">{opt}</span>
              <button className="text-ink/40 hover:text-ink/75 px-1" onClick={() => move(i, -1)}>↑</button>
              <button className="text-ink/40 hover:text-ink/75 px-1" onClick={() => move(i, 1)}>↓</button>
            </div>
          ))}
        </div>
      );
    }
  }
}
