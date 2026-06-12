"use client";

import { cid } from "@/lib/id";
import { UsabilityConfig } from "@/lib/types";

export default function UsabilityBuilder({
  config,
  onChange,
}: {
  config: UsabilityConfig;
  onChange: (c: UsabilityConfig) => void;
}) {
  const set = (patch: Partial<UsabilityConfig>) => onChange({ ...config, ...patch });

  return (
    <div className="max-w-3xl space-y-5">
      <p className="text-sm text-ink/50">
        Unmoderated task-based testing. Participants complete each task on your
        live site or prototype, then self-report the outcome. Time on task is
        recorded automatically.
      </p>

      <div className="card p-5">
        <h2 className="font-semibold text-ink mb-3">
          Tasks ({config.tasks.length})
        </h2>
        <div className="space-y-3">
          {config.tasks.map((task, i) => (
            <div key={task.id} className="flex gap-2 items-start">
              <span className="text-xs font-semibold text-ink/40 mt-2.5 w-6">
                T{i + 1}
              </span>
              <div className="flex-1 space-y-1.5">
                <textarea
                  className="input min-h-16"
                  placeholder="e.g. Find the price of the premium plan and add it to your cart."
                  value={task.text}
                  onChange={(e) => {
                    const tasks = [...config.tasks];
                    tasks[i] = { ...task, text: e.target.value };
                    set({ tasks });
                  }}
                />
                <input
                  className="input"
                  placeholder="URL to open for this task (optional) — e.g. https://your-site.com"
                  value={task.url ?? ""}
                  onChange={(e) => {
                    const tasks = [...config.tasks];
                    tasks[i] = { ...task, url: e.target.value };
                    set({ tasks });
                  }}
                />
              </div>
              <button
                className="text-ink/40 hover:text-red-500 mt-2"
                onClick={() => set({ tasks: config.tasks.filter((t) => t.id !== task.id) })}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn-secondary mt-3"
          onClick={() => set({ tasks: [...config.tasks, { id: cid("t"), text: "" }] })}
        >
          + Add task
        </button>
      </div>

      <div className="card p-5 space-y-2 text-sm text-ink/75">
        <h2 className="font-semibold text-ink mb-1">Per-task follow-ups</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.askDifficulty}
            onChange={(e) => set({ askDifficulty: e.target.checked })}
          />
          Ask difficulty rating after each task (Single Ease Question, 1–7)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.askComment}
            onChange={(e) => set({ askComment: e.target.checked })}
          />
          Ask for an open comment after each task
        </label>
      </div>
    </div>
  );
}
