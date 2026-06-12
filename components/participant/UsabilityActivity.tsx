"use client";

import { useRef, useState } from "react";
import { ResultData, UsabilityConfig, UsabilityTaskResult } from "@/lib/types";

export default function UsabilityActivity({
  config,
  instructions,
  onDone,
}: {
  config: UsabilityConfig;
  instructions: string;
  onDone: (d: ResultData) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [intro, setIntro] = useState(true);
  const [phase, setPhase] = useState<"doing" | "report">("doing");
  const [completion, setCompletion] = useState<UsabilityTaskResult["completion"] | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const results = useRef<UsabilityTaskResult[]>([]);
  const taskStart = useRef(Date.now());
  const taskTime = useRef(0);

  const task = config.tasks[idx];

  const startReport = (skipped: boolean) => {
    taskTime.current = Date.now() - taskStart.current;
    if (skipped) {
      record("skipped");
    } else {
      setPhase("report");
    }
  };

  const record = (forcedCompletion?: UsabilityTaskResult["completion"]) => {
    results.current.push({
      taskId: task.id,
      completion: forcedCompletion ?? completion ?? "success",
      difficulty,
      comment,
      timeMs: taskTime.current || Date.now() - taskStart.current,
    });
    setPhase("doing");
    setCompletion(null);
    setDifficulty(null);
    setComment("");
    taskStart.current = Date.now();
    if (idx + 1 < config.tasks.length) setIdx(idx + 1);
    else onDone({ tasks: results.current });
  };

  if (intro) {
    return (
      <Wrap>
        <h2 className="font-semibold text-lg text-ink mb-3">How this works</h2>
        <p className="text-ink/60 text-sm whitespace-pre-wrap mb-6">
          {instructions ||
            "You'll be given a series of tasks to complete on a website or app. Complete each task as you normally would, then come back to this tab and tell us how it went."}
        </p>
        <button
          className="btn-primary"
          onClick={() => {
            setIntro(false);
            taskStart.current = Date.now();
          }}
        >
          Start first task →
        </button>
      </Wrap>
    );
  }

  if (phase === "doing") {
    return (
      <Wrap>
        <p className="eyebrow mb-2">
          Task {idx + 1} of {config.tasks.length}
        </p>
        <p className="text-ink font-medium text-lg mb-4">{task.text}</p>
        {task.url && (
          <a
            href={task.url}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary mb-4"
          >
            Open ↗ {new URL(task.url.startsWith("http") ? task.url : `https://${task.url}`).hostname}
          </a>
        )}
        <p className="text-sm text-ink/50 mb-6">
          When you’ve attempted the task, come back here and continue.
        </p>
        <div className="flex gap-3">
          <button className="btn-primary" onClick={() => startReport(false)}>
            I’m done with this task
          </button>
          <button
            className="text-sm text-ink/40 hover:text-ink/60"
            onClick={() => startReport(true)}
          >
            Skip task
          </button>
        </div>
      </Wrap>
    );
  }

  // report phase
  return (
    <Wrap>
      <p className="eyebrow mb-2">
        Task {idx + 1} — how did it go?
      </p>
      <div className="space-y-5">
        <div>
          <p className="font-medium text-ink mb-2">Were you able to complete the task?</p>
          <div className="flex gap-2 flex-wrap">
            {(
              [
                ["success", "Yes, fully", "bg-green-500"],
                ["partial", "Partially", "bg-amber-400"],
                ["fail", "No", "bg-red-500"],
              ] as const
            ).map(([v, label, dot]) => (
              <button
                key={v}
                onClick={() => setCompletion(v)}
                className={`btn ${
                  completion === v
                    ? "bg-ink text-white"
                    : "bg-white border border-ink/20 text-ink/75 hover:border-ink"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${dot}`} /> {label}
              </button>
            ))}
          </div>
        </div>

        {config.askDifficulty && (
          <div>
            <p className="font-medium text-ink mb-2">
              Overall, how difficult or easy was the task?
            </p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((v) => (
                <button
                  key={v}
                  onClick={() => setDifficulty(v)}
                  className={`w-10 h-10 rounded-lg border text-sm font-medium ${
                    difficulty === v
                      ? "bg-ink text-white border-ink"
                      : "bg-white border-ink/20 text-ink/75 hover:border-ink"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-ink/50 mt-1 max-w-80">
              <span>Very difficult</span>
              <span>Very easy</span>
            </div>
          </div>
        )}

        {config.askComment && (
          <div>
            <p className="font-medium text-ink mb-2">
              Anything you’d like to add? (optional)
            </p>
            <textarea
              className="input min-h-20"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}

        <button
          className="btn-primary"
          disabled={completion === null}
          onClick={() => record()}
        >
          {idx + 1 < config.tasks.length ? "Next task →" : "Finish"}
        </button>
      </div>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-paper">
      <div className="card p-10 max-w-xl w-full">{children}</div>
    </div>
  );
}
