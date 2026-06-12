"use client";

import { useMemo, useRef, useState } from "react";
import {
  ResultData,
  TreeNode,
  TreeTaskResult,
  TreeTestConfig,
} from "@/lib/types";

export default function TreeTestActivity({
  config,
  instructions,
  onDone,
}: {
  config: TreeTestConfig;
  instructions: string;
  onDone: (d: ResultData) => void;
}) {
  const tasks = useMemo(() => {
    const list = [...config.tasks];
    if (config.shuffleTasks) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [taskIdx, setTaskIdx] = useState(0);
  const [intro, setIntro] = useState(true);
  const results = useRef<TreeTaskResult[]>([]);

  const task = tasks[taskIdx];

  const onTaskDone = (r: TreeTaskResult) => {
    results.current.push(r);
    if (taskIdx + 1 < tasks.length) setTaskIdx(taskIdx + 1);
    else onDone({ tasks: results.current });
  };

  if (intro) {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-paper">
        <div className="card p-10 max-w-xl">
          <h2 className="font-semibold text-lg text-ink mb-3">How this works</h2>
          <p className="text-ink/60 text-sm whitespace-pre-wrap mb-2">
            {instructions ||
              "You'll be given a series of tasks. For each one, click through the menu structure until you reach the place where you'd expect to find the answer, then choose “I'd find it here”."}
          </p>
          <p className="text-ink/50 text-sm mb-6">
            There are {tasks.length} task{tasks.length === 1 ? "" : "s"}. Go with
            your instinct — there are no right or wrong answers.
          </p>
          <button className="btn-primary" onClick={() => setIntro(false)}>
            Start first task →
          </button>
        </div>
      </div>
    );
  }

  return (
    <TreeTaskRunner
      key={task.id}
      tree={config.tree}
      taskText={task.text}
      taskNumber={taskIdx + 1}
      taskCount={tasks.length}
      onDone={(path, answerNodeId, backtracked, timeMs) => {
        const correct = answerNodeId !== null && task.correctNodeIds.includes(answerNodeId);
        const outcome =
          answerNodeId === null
            ? "skipped"
            : correct
              ? backtracked
                ? "indirect-success"
                : "direct-success"
              : backtracked
                ? "indirect-fail"
                : "direct-fail";
        onTaskDone({
          taskId: task.id,
          path,
          answerNodeId,
          outcome,
          timeMs,
          firstClickNodeId: path[0] ?? null,
        });
      }}
    />
  );
}

function TreeTaskRunner({
  tree,
  taskText,
  taskNumber,
  taskCount,
  onDone,
}: {
  tree: TreeNode[];
  taskText: string;
  taskNumber: number;
  taskCount: number;
  onDone: (
    path: string[],
    answerNodeId: string | null,
    backtracked: boolean,
    timeMs: number
  ) => void;
}) {
  /** stack of nodes we've drilled into (ancestors of current list) */
  const [stack, setStack] = useState<TreeNode[]>([]);
  const path = useRef<string[]>([]);
  const backtracked = useRef(false);
  const start = useRef(Date.now());

  const currentChildren = stack.length ? stack[stack.length - 1].children : tree;

  const drill = (node: TreeNode) => {
    path.current.push(node.id);
    if (node.children.length > 0) {
      setStack((s) => [...s, node]);
    } else {
      // leaf — selecting it answers the task
      onDone(path.current, node.id, backtracked.current, Date.now() - start.current);
    }
  };

  const goUp = (toIndex: number) => {
    backtracked.current = true;
    setStack((s) => s.slice(0, toIndex));
  };

  const pickHere = () => {
    const here = stack[stack.length - 1];
    onDone(path.current, here?.id ?? null, backtracked.current, Date.now() - start.current);
  };

  const skip = () =>
    onDone(path.current, null, backtracked.current, Date.now() - start.current);

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-white border-b border-ink/10 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto">
          <p className="eyebrow mb-1">
            Task {taskNumber} of {taskCount}
          </p>
          <p className="text-ink font-medium">{taskText}</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-1 text-sm mb-4 min-h-6">
          <button
            className="text-accent hover:underline"
            onClick={() => stack.length && goUp(0)}
          >
            Start
          </button>
          {stack.map((n, i) => (
            <span key={n.id} className="flex items-center gap-1">
              <span className="text-ink/40">›</span>
              {i === stack.length - 1 ? (
                <span className="font-medium text-ink">{n.label}</span>
              ) : (
                <button
                  className="text-accent hover:underline"
                  onClick={() => goUp(i + 1)}
                >
                  {n.label}
                </button>
              )}
            </span>
          ))}
        </div>

        <div className="card divide-y divide-ink/5 overflow-hidden">
          {currentChildren.map((n) => (
            <button
              key={n.id}
              onClick={() => drill(n)}
              className="w-full text-left px-4 py-3 text-sm text-ink hover:bg-lime/40 flex items-center justify-between"
            >
              {n.label}
              <span className="text-ink/25">
                {n.children.length > 0 ? "›" : "○"}
              </span>
            </button>
          ))}
          {currentChildren.length === 0 && (
            <p className="px-4 py-3 text-sm text-ink/40">Nothing further here.</p>
          )}
        </div>

        <div className="flex items-center gap-3 mt-5">
          {stack.length > 0 && (
            <button className="btn-primary" onClick={pickHere}>
              ✓ I’d find it here{stack.length ? `: “${stack[stack.length - 1].label}”` : ""}
            </button>
          )}
          <button className="text-sm text-ink/40 hover:text-ink/60" onClick={skip}>
            Skip this task
          </button>
        </div>
      </div>
    </div>
  );
}
