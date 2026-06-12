"use client";

import { useRef, useState } from "react";
import {
  PrototypeClick,
  PrototypeConfig,
  PrototypeTaskResult,
  ResultData,
} from "@/lib/types";

export default function PrototypeActivity({
  config,
  instructions,
  onDone,
}: {
  config: PrototypeConfig;
  instructions: string;
  onDone: (d: ResultData) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [intro, setIntro] = useState(true);
  const results = useRef<PrototypeTaskResult[]>([]);

  const task = config.tasks[idx];

  const onTaskDone = (r: PrototypeTaskResult) => {
    results.current.push(r);
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
              "You'll interact with a clickable prototype. For each task, click through the screens as you would in a real app. Don't worry if something doesn't respond — just try what feels natural."}
          </p>
          <button className="btn-primary" onClick={() => setIntro(false)}>
            Start →
          </button>
        </div>
      </div>
    );
  }

  return (
    <PrototypeTaskRunner
      key={task.id}
      config={config}
      taskId={task.id}
      taskText={task.text}
      startScreenId={task.startScreenId}
      goalScreenIds={task.goalScreenIds}
      taskNumber={idx + 1}
      taskCount={config.tasks.length}
      onDone={onTaskDone}
    />
  );
}

function PrototypeTaskRunner({
  config,
  taskId,
  taskText,
  startScreenId,
  goalScreenIds,
  taskNumber,
  taskCount,
  onDone,
}: {
  config: PrototypeConfig;
  taskId: string;
  taskText: string;
  startScreenId: string;
  goalScreenIds: string[];
  taskNumber: number;
  taskCount: number;
  onDone: (r: PrototypeTaskResult) => void;
}) {
  const [screenId, setScreenId] = useState(startScreenId || config.screens[0]?.id);
  const [success, setSuccess] = useState(false);
  const clicks = useRef<PrototypeClick[]>([]);
  const screenPath = useRef<string[]>([screenId]);
  const start = useRef(Date.now());

  const screen = config.screens.find((s) => s.id === screenId);

  const finish = (outcome: "success" | "gave-up") =>
    onDone({
      taskId,
      clicks: clicks.current,
      screenPath: screenPath.current,
      outcome,
      timeMs: Date.now() - start.current,
    });

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!screen || success) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const hit = screen.hotspots.find(
      (h) => h.targetScreenId && x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h
    );
    clicks.current.push({
      screenId: screen.id,
      x,
      y,
      hitHotspot: !!hit,
      timeMs: Date.now() - start.current,
    });
    if (hit) {
      screenPath.current.push(hit.targetScreenId);
      if (goalScreenIds.includes(hit.targetScreenId)) {
        setScreenId(hit.targetScreenId);
        setSuccess(true);
        setTimeout(() => finish("success"), 1200);
      } else {
        setScreenId(hit.targetScreenId);
      }
    }
  };

  if (!screen) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <p className="text-ink/50 text-sm">
          This task is misconfigured (missing screen).{" "}
          <button className="text-accent underline" onClick={() => finish("gave-up")}>
            Skip
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink/5">
      <header className="bg-white border-b border-ink/10 px-6 py-3 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink/75">
            <span className="font-semibold text-accent">
              Task {taskNumber}/{taskCount}:
            </span>{" "}
            {taskText}
          </p>
          <button
            className="text-sm text-ink/40 hover:text-ink/60"
            onClick={() => finish("gave-up")}
          >
            I give up / skip
          </button>
        </div>
      </header>
      <div className="max-w-4xl mx-auto p-6">
        <div className="relative inline-block max-w-full" onClick={onClick}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screen.image}
            alt={screen.name}
            className="max-w-full rounded-lg border border-ink/20 shadow-sm cursor-pointer select-none"
            draggable={false}
          />
          {success && (
            <div className="absolute inset-0 bg-green-600/80 rounded-lg grid place-items-center">
              <p className="text-white font-semibold text-xl">✓ Task complete!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
