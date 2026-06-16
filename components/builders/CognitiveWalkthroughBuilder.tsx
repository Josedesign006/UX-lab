"use client";

import { cid } from "@/lib/id";
import { fileToDataUrl } from "@/lib/image";
import { CW_DIMENSION_META } from "@/lib/analysis";
import { CognitiveWalkthroughConfig, CWStep, CWTask } from "@/lib/types";

export default function CognitiveWalkthroughBuilder({
  config,
  onChange,
}: {
  config: CognitiveWalkthroughConfig;
  onChange: (c: CognitiveWalkthroughConfig) => void;
}) {
  const set = (patch: Partial<CognitiveWalkthroughConfig>) =>
    onChange({ ...config, ...patch });

  const setTask = (id: string, patch: Partial<CWTask>) =>
    set({
      tasks: config.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });

  const setStep = (taskId: string, stepId: string, patch: Partial<CWStep>) =>
    set({
      tasks: config.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              steps: t.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
            }
          : t
      ),
    });

  const moveStep = (taskId: string, idx: number, dir: -1 | 1) =>
    set({
      tasks: config.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const steps = [...t.steps];
        const j = idx + dir;
        if (j < 0 || j >= steps.length) return t;
        [steps[idx], steps[j]] = [steps[j], steps[idx]];
        return { ...t, steps };
      }),
    });

  return (
    <div className="max-w-3xl space-y-5">
      <p className="text-sm text-ink/50">
        A cognitive walkthrough inspects <strong>learnability</strong> for
        first-time users. You define the goal and the <em>correct</em> action
        sequence for each task; evaluators then judge, step by step, whether a
        new user would succeed — answering the four classic walkthrough
        questions (Wharton et&nbsp;al., 1994) at every step.
      </p>

      {/* Persona */}
      <div className="card p-5">
        <h2 className="font-semibold text-ink mb-1">The assumed user (persona)</h2>
        <p className="text-sm text-ink/50 mb-3">
          Evaluators role-play this person at every step. Be specific about
          their prior knowledge — learnability is always relative to a user.
        </p>
        <textarea
          className="input min-h-20"
          value={config.persona}
          onChange={(e) => set({ persona: e.target.value })}
          placeholder="e.g. A first-time user who has shopped online before but never used this app…"
        />
      </div>

      {/* The four questions */}
      <div className="card p-5">
        <h2 className="font-semibold text-ink mb-1">
          The four walkthrough questions
        </h2>
        <p className="text-sm text-ink/50 mb-4">
          Asked at every step. Each maps to a cognitive dimension — keep all
          four for the classic method, or reword them to fit your product.
        </p>
        <div className="space-y-3">
          {config.questions.map((q, i) => {
            const dim = CW_DIMENSION_META[q.dimension];
            return (
              <div key={q.id} className="flex gap-3 items-start">
                <span
                  className="mt-1 text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-1 rounded-md text-white shrink-0 w-28 text-center"
                  style={{ backgroundColor: dim.color }}
                  title={dim.blurb}
                >
                  {dim.short}
                </span>
                <input
                  className="input"
                  value={q.text}
                  onChange={(e) => {
                    const questions = [...config.questions];
                    questions[i] = { ...q, text: e.target.value };
                    set({ questions });
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">
            Tasks ({config.tasks.length})
          </h2>
        </div>

        {config.tasks.map((task, ti) => (
          <div key={task.id} className="card p-5 space-y-4">
            <div className="flex gap-2 items-start">
              <span className="text-xs font-semibold text-ink/40 mt-2.5 w-7 shrink-0">
                T{ti + 1}
              </span>
              <div className="flex-1 space-y-1.5">
                <input
                  className="input font-medium"
                  placeholder="Task goal — e.g. Cancel an active subscription"
                  value={task.text}
                  onChange={(e) => setTask(task.id, { text: e.target.value })}
                />
                <input
                  className="input text-sm"
                  placeholder="Starting context (optional) — where does the user begin?"
                  value={task.startContext ?? ""}
                  onChange={(e) =>
                    setTask(task.id, { startContext: e.target.value })
                  }
                />
              </div>
              <button
                className="text-ink/40 hover:text-red-500 mt-2"
                title="Delete task"
                onClick={() =>
                  set({ tasks: config.tasks.filter((t) => t.id !== task.id) })
                }
              >
                ✕
              </button>
            </div>

            {/* Steps = the correct action sequence */}
            <div className="pl-9 space-y-2.5">
              <p className="eyebrow">Correct action sequence</p>
              {task.steps.map((step, si) => (
                <div
                  key={step.id}
                  className="rounded-xl border border-ink/10 bg-paper p-3 space-y-2"
                >
                  <div className="flex gap-2 items-center">
                    <span className="w-6 h-6 rounded-full bg-ink text-lime grid place-items-center text-xs font-semibold shrink-0">
                      {si + 1}
                    </span>
                    <input
                      className="input bg-white"
                      placeholder="The one correct action — e.g. Click the “Account” menu"
                      value={step.action}
                      onChange={(e) =>
                        setStep(task.id, step.id, { action: e.target.value })
                      }
                    />
                    <div className="flex flex-col">
                      <button
                        className="text-ink/30 hover:text-ink leading-none text-xs"
                        onClick={() => moveStep(task.id, si, -1)}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        className="text-ink/30 hover:text-ink leading-none text-xs"
                        onClick={() => moveStep(task.id, si, 1)}
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      className="text-ink/40 hover:text-red-500"
                      title="Delete step"
                      onClick={() =>
                        setTask(task.id, {
                          steps: task.steps.filter((s) => s.id !== step.id),
                        })
                      }
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    className="input bg-white text-sm ml-8 w-[calc(100%-2rem)]"
                    placeholder="System response after this action (optional) — what the user should see happen"
                    value={step.systemResponse ?? ""}
                    onChange={(e) =>
                      setStep(task.id, step.id, { systemResponse: e.target.value })
                    }
                  />
                  <div className="ml-8">
                    {step.screenshot ? (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={step.screenshot}
                          alt=""
                          className="h-14 rounded-md border border-ink/10"
                        />
                        <button
                          className="text-xs text-ink/50 hover:text-red-500"
                          onClick={() =>
                            setStep(task.id, step.id, { screenshot: "" })
                          }
                        >
                          Remove screenshot
                        </button>
                      </div>
                    ) : (
                      <label className="text-xs text-ink/45 hover:text-ink cursor-pointer">
                        + Add screenshot for this step (optional)
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const screenshot = await fileToDataUrl(file);
                            setStep(task.id, step.id, { screenshot });
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
              <button
                className="btn-secondary text-sm"
                onClick={() =>
                  setTask(task.id, {
                    steps: [...task.steps, { id: cid("st"), action: "" }],
                  })
                }
              >
                + Add step
              </button>
            </div>
          </div>
        ))}

        <button
          className="btn-secondary"
          onClick={() =>
            set({
              tasks: [
                ...config.tasks,
                {
                  id: cid("t"),
                  text: "",
                  steps: [{ id: cid("st"), action: "" }],
                },
              ],
            })
          }
        >
          + Add task
        </button>
      </div>

      {/* Options */}
      <div className="card p-5 space-y-2 text-sm text-ink/75">
        <h2 className="font-semibold text-ink mb-1">When a step is flagged</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.askFailureStory}
            onChange={(e) => set({ askFailureStory: e.target.checked })}
          />
          Ask the evaluator to write a “failure story” (why would a user fail?)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.askSeverity}
            onChange={(e) => set({ askSeverity: e.target.checked })}
          />
          Ask for a severity rating (0–4, Nielsen scale)
        </label>
      </div>
    </div>
  );
}
