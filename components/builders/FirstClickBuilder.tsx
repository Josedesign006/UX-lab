"use client";

import { cid } from "@/lib/id";
import { fileToDataUrl } from "@/lib/image";
import { FirstClickConfig } from "@/lib/types";

export default function FirstClickBuilder({
  config,
  onChange,
}: {
  config: FirstClickConfig;
  onChange: (c: FirstClickConfig) => void;
}) {
  const set = (patch: Partial<FirstClickConfig>) => onChange({ ...config, ...patch });

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-ink/50">
        Each task shows an image and asks the participant where they would click
        first. Their first click position and time are recorded.
      </p>
      {config.tasks.map((task, i) => (
        <div key={task.id} className="card p-5 space-y-3">
          <div className="flex gap-2 items-start">
            <span className="text-xs font-semibold text-ink/40 mt-2.5 w-6">
              T{i + 1}
            </span>
            <textarea
              className="input min-h-16"
              placeholder="e.g. Where would you click to contact customer support?"
              value={task.instruction}
              onChange={(e) => {
                const tasks = [...config.tasks];
                tasks[i] = { ...task, instruction: e.target.value };
                set({ tasks });
              }}
            />
            <button
              className="text-ink/40 hover:text-red-500 mt-2"
              onClick={() => set({ tasks: config.tasks.filter((t) => t.id !== task.id) })}
            >
              ✕
            </button>
          </div>
          <div className="pl-8">
            {task.image ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={task.image}
                  alt="Task design"
                  className="max-h-72 rounded-lg border border-ink/10"
                />
                <button
                  className="text-sm text-red-500 hover:underline"
                  onClick={() => {
                    const tasks = [...config.tasks];
                    tasks[i] = { ...task, image: "" };
                    set({ tasks });
                  }}
                >
                  Remove image
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-ink/20 rounded-lg p-8 text-center text-sm text-ink/50 cursor-pointer hover:border-ink">
                Click to upload a design image (PNG/JPG)
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const image = await fileToDataUrl(file);
                    const tasks = [...config.tasks];
                    tasks[i] = { ...task, image };
                    set({ tasks });
                  }}
                />
              </label>
            )}
          </div>
        </div>
      ))}
      <button
        className="btn-secondary"
        onClick={() =>
          set({ tasks: [...config.tasks, { id: cid("t"), instruction: "", image: "" }] })
        }
      >
        + Add task
      </button>
    </div>
  );
}
