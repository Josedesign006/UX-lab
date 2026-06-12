"use client";

import { useRef, useState } from "react";
import { FirstClickConfig, FirstClickTaskResult, ResultData } from "@/lib/types";

export default function FirstClickActivity({
  config,
  instructions,
  onDone,
}: {
  config: FirstClickConfig;
  instructions: string;
  onDone: (d: ResultData) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [intro, setIntro] = useState(true);
  const [showing, setShowing] = useState(false);
  const results = useRef<FirstClickTaskResult[]>([]);
  const taskStart = useRef(0);

  const task = config.tasks[idx];

  const begin = () => {
    setShowing(true);
    taskStart.current = Date.now();
  };

  const click = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    results.current.push({
      taskId: task.id,
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      timeMs: Date.now() - taskStart.current,
    });
    setShowing(false);
    if (idx + 1 < config.tasks.length) setIdx(idx + 1);
    else onDone({ tasks: results.current });
  };

  if (intro) {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-paper">
        <div className="card p-10 max-w-xl">
          <h2 className="font-semibold text-lg text-ink mb-3">How this works</h2>
          <p className="text-ink/60 text-sm whitespace-pre-wrap mb-6">
            {instructions ||
              "You'll see a series of designs. For each one, read the task, then click the one place on the design where you would click first. Your first click is what counts — go with your instinct."}
          </p>
          <button className="btn-primary" onClick={() => setIntro(false)}>
            Start →
          </button>
        </div>
      </div>
    );
  }

  if (!showing) {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-paper">
        <div className="card p-10 max-w-xl text-center">
          <p className="eyebrow mb-2">
            Task {idx + 1} of {config.tasks.length}
          </p>
          <p className="text-ink font-medium text-lg mb-6">{task.instruction}</p>
          <button className="btn-primary" onClick={begin}>
            Show me the design
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink/5">
      <header className="bg-white border-b border-ink/10 px-6 py-3 sticky top-0 z-30">
        <p className="max-w-4xl mx-auto text-sm text-ink/75">
          <span className="font-semibold text-accent">
            Task {idx + 1}/{config.tasks.length}:
          </span>{" "}
          {task.instruction} — click where you would click first.
        </p>
      </header>
      <div className="max-w-4xl mx-auto p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={task.image}
          alt="Design"
          onClick={click}
          className="w-full rounded-lg border border-ink/20 cursor-crosshair shadow-sm"
        />
      </div>
    </div>
  );
}
