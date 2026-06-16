"use client";

import { useMemo, useRef, useState } from "react";
import { CW_DIMENSION_META } from "@/lib/analysis";
import {
  CognitiveWalkthroughConfig,
  CWQuestionAnswer,
  CWStepResult,
  CWTaskResult,
  CWVerdict,
  ResultData,
} from "@/lib/types";

const SEVERITY_LABELS = [
  "0 — Not a problem",
  "1 — Cosmetic",
  "2 — Minor",
  "3 — Major",
  "4 — Catastrophic",
];

export default function CognitiveWalkthroughActivity({
  config,
  instructions,
  onDone,
}: {
  config: CognitiveWalkthroughConfig;
  instructions: string;
  onDone: (d: ResultData) => void;
}) {
  const [intro, setIntro] = useState(true);
  const [ti, setTi] = useState(0);
  const [si, setSi] = useState(0);
  const [verdicts, setVerdicts] = useState<Record<string, CWVerdict>>({});
  const [severity, setSeverity] = useState<number | null>(null);
  const [failureStory, setFailureStory] = useState("");
  const [zoom, setZoom] = useState(false);

  const taskResults = useRef<CWTaskResult[]>([]);
  const currentTaskSteps = useRef<CWStepResult[]>([]);
  const stepStart = useRef(Date.now());

  const task = config.tasks[ti];
  const step = task?.steps[si];

  const totalSteps = useMemo(
    () => config.tasks.reduce((n, t) => n + t.steps.length, 0),
    [config.tasks]
  );
  const stepNumber = useMemo(() => {
    let n = 0;
    for (let i = 0; i < ti; i++) n += config.tasks[i].steps.length;
    return n + si + 1;
  }, [config.tasks, ti, si]);

  const hasProblem = Object.values(verdicts).some(
    (v) => v === "no" || v === "unsure"
  );
  const allAnswered = config.questions.every((q) => verdicts[q.id]);

  if (!task || !step) {
    // empty study — nothing to evaluate
    return (
      <Wrap>
        <p className="text-ink/60">This walkthrough has no steps configured.</p>
        <button
          className="btn-primary mt-4"
          onClick={() => onDone({ tasks: [] })}
        >
          Finish
        </button>
      </Wrap>
    );
  }

  const next = () => {
    const answers: CWQuestionAnswer[] = config.questions.map((q) => ({
      questionId: q.id,
      verdict: verdicts[q.id],
    }));
    currentTaskSteps.current.push({
      stepId: step.id,
      answers,
      severity: hasProblem && config.askSeverity ? severity ?? 0 : null,
      failureStory: hasProblem && config.askFailureStory ? failureStory.trim() : "",
      timeMs: Date.now() - stepStart.current,
    });

    // reset per-step state
    setVerdicts({});
    setSeverity(null);
    setFailureStory("");
    setZoom(false);
    stepStart.current = Date.now();

    const lastStep = si + 1 >= task.steps.length;
    if (lastStep) {
      taskResults.current.push({
        taskId: task.id,
        steps: currentTaskSteps.current,
      });
      currentTaskSteps.current = [];
      if (ti + 1 >= config.tasks.length) {
        onDone({ tasks: taskResults.current });
        return;
      }
      setTi(ti + 1);
      setSi(0);
    } else {
      setSi(si + 1);
    }
  };

  if (intro) {
    return (
      <Wrap>
        <p className="eyebrow mb-2">Cognitive walkthrough</p>
        <h2 className="font-semibold text-lg text-ink mb-3">How this works</h2>
        <p className="text-ink/60 text-sm whitespace-pre-wrap mb-4">
          {instructions ||
            "You'll step through each task as if you were the user described below. At every step we'll show you the one correct action, then ask a few quick questions about whether that user would actually succeed. Judge from the user's perspective — not your own expertise."}
        </p>
        <div className="rounded-xl bg-paper border border-ink/10 p-4 mb-6">
          <p className="eyebrow mb-1">Imagine you are…</p>
          <p className="text-sm text-ink/80">{config.persona}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setIntro(false);
            stepStart.current = Date.now();
          }}
        >
          Start walkthrough →
        </button>
      </Wrap>
    );
  }

  return (
    <Wrap wide>
      {/* progress */}
      <div className="flex items-center justify-between mb-4">
        <p className="eyebrow">
          Task {ti + 1} of {config.tasks.length} · Step {si + 1} of{" "}
          {task.steps.length}
        </p>
        <span className="text-xs text-ink/40 font-mono">
          {stepNumber}/{totalSteps}
        </span>
      </div>
      <div className="h-1 rounded-full bg-ink/10 mb-6 overflow-hidden">
        <div
          className="h-full bg-lime transition-all"
          style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
        />
      </div>

      {/* task + persona context */}
      <div className="mb-5">
        <p className="text-xs text-ink/45">
          As <span className="font-medium text-ink/70">the assumed user</span>,
          your goal is:
        </p>
        <p className="text-ink font-semibold text-lg leading-snug">
          {task.text}
        </p>
        {si === 0 && task.startContext && (
          <p className="text-sm text-ink/55 mt-1">{task.startContext}</p>
        )}
      </div>

      {/* the correct action at this step */}
      <div className="rounded-xl border border-ink/10 bg-paper p-4 mb-6">
        <p className="eyebrow mb-1">Correct action at this step</p>
        <p className="text-ink font-medium">{step.action}</p>
        {step.systemResponse && (
          <p className="text-sm text-ink/55 mt-2">
            <span className="font-medium text-ink/70">Then:</span>{" "}
            {step.systemResponse}
          </p>
        )}
        {step.screenshot && (
          <figure className="mt-3">
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="block w-full group relative"
              title="Click to enlarge"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.screenshot}
                alt=""
                className="w-full rounded-lg border border-ink/10 group-hover:border-ink/30 transition-colors"
              />
              <span className="absolute bottom-2 right-2 text-[11px] font-medium px-2 py-1 rounded-md bg-ink/75 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Click to enlarge ⤢
              </span>
            </button>
          </figure>
        )}
      </div>

      {/* the four questions */}
      <div className="space-y-4">
        {config.questions.map((q, i) => {
          const dim = CW_DIMENSION_META[q.dimension];
          const v = verdicts[q.id];
          return (
            <div key={q.id}>
              <div className="flex items-start gap-2 mb-2">
                <span
                  className="mt-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-white shrink-0"
                  style={{ backgroundColor: dim.color }}
                >
                  Q{i + 1}
                </span>
                <p className="text-ink font-medium text-sm">{q.text}</p>
              </div>
              <div className="flex gap-2 ml-7">
                {(
                  [
                    ["yes", "Yes"],
                    ["unsure", "Unsure"],
                    ["no", "No"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setVerdicts({ ...verdicts, [q.id]: val })}
                    className={`btn text-sm ${
                      v === val
                        ? val === "yes"
                          ? "bg-green-600 text-white"
                          : val === "no"
                            ? "bg-red-600 text-white"
                            : "bg-amber-500 text-white"
                        : "bg-white border border-ink/20 text-ink/75 hover:border-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* problem follow-ups */}
      {hasProblem && (config.askSeverity || config.askFailureStory) && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50/60 p-4 space-y-4">
          <p className="text-sm font-semibold text-red-700">
            You flagged a potential breakdown here.
          </p>
          {config.askFailureStory && (
            <div>
              <p className="text-sm font-medium text-ink/80 mb-1.5">
                Why would this user struggle? (failure story)
              </p>
              <textarea
                className="input min-h-20 bg-white"
                placeholder="e.g. The label says “Manage”, which a first-time user wouldn't link to cancelling…"
                value={failureStory}
                onChange={(e) => setFailureStory(e.target.value)}
              />
            </div>
          )}
          {config.askSeverity && (
            <div>
              <p className="text-sm font-medium text-ink/80 mb-1.5">
                How severe is this problem?
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SEVERITY_LABELS.map((label, n) => (
                  <button
                    key={n}
                    onClick={() => setSeverity(n)}
                    className={`btn text-xs ${
                      severity === n
                        ? "bg-ink text-white"
                        : "bg-white border border-ink/20 text-ink/75 hover:border-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-7 flex items-center gap-3">
        <button className="btn-primary" disabled={!allAnswered} onClick={next}>
          {stepNumber >= totalSteps ? "Finish walkthrough" : "Next step →"}
        </button>
        {!allAnswered && (
          <span className="text-xs text-ink/40">
            Answer all questions to continue
          </span>
        )}
      </div>

      {zoom && step.screenshot && (
        <div
          className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm p-4 sm:p-8 overflow-auto cursor-zoom-out animate-[fadeIn_120ms_ease-out]"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            className="fixed top-4 right-4 w-10 h-10 rounded-full bg-white/90 text-ink grid place-items-center text-lg shadow-lg"
            onClick={() => setZoom(false)}
            aria-label="Close"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={step.screenshot}
            alt=""
            className="mx-auto rounded-lg shadow-2xl max-w-none w-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ minWidth: "min(1100px, 100%)" }}
          />
        </div>
      )}
    </Wrap>
  );
}

function Wrap({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-paper">
      <div className={`card p-10 w-full ${wide ? "max-w-2xl" : "max-w-xl"}`}>
        {children}
      </div>
    </div>
  );
}
