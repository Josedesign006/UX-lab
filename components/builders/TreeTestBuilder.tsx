"use client";

import { useState } from "react";
import { cid } from "@/lib/id";
import { flattenTree } from "@/lib/analysis";
import { TreeNode, TreeTestConfig } from "@/lib/types";

export default function TreeTestBuilder({
  config,
  onChange,
}: {
  config: TreeTestConfig;
  onChange: (c: TreeTestConfig) => void;
}) {
  const [bulk, setBulk] = useState("");
  const set = (patch: Partial<TreeTestConfig>) => onChange({ ...config, ...patch });

  // ----- tree mutation helpers -----
  const mapTree = (
    nodes: TreeNode[],
    fn: (n: TreeNode) => TreeNode | null
  ): TreeNode[] =>
    nodes
      .map((n) => fn({ ...n, children: mapTree(n.children, fn) }))
      .filter((n): n is TreeNode => n !== null);

  const rename = (id: string, label: string) =>
    set({ tree: mapTree(config.tree, (n) => (n.id === id ? { ...n, label } : n)) });

  const addChild = (parentId: string | null) => {
    const child: TreeNode = { id: cid("n"), label: "New item", children: [] };
    if (parentId === null) {
      set({ tree: [...config.tree, child] });
    } else {
      set({
        tree: mapTree(config.tree, (n) =>
          n.id === parentId ? { ...n, children: [...n.children, child] } : n
        ),
      });
    }
  };

  const removeNode = (id: string) =>
    set({ tree: mapTree(config.tree, (n) => (n.id === id ? null : n)) });

  // ----- bulk import: indentation-based -----
  const importBulk = () => {
    const lines = bulk.split("\n").filter((l) => l.trim());
    if (!lines.length) return;
    const roots: TreeNode[] = [];
    const stack: { depth: number; node: TreeNode }[] = [];
    for (const line of lines) {
      const indent = line.match(/^[\t ]*/)?.[0] ?? "";
      const depth = indent.replace(/\t/g, "  ").length / 2;
      const node: TreeNode = { id: cid("n"), label: line.trim(), children: [] };
      while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
      if (stack.length === 0) roots.push(node);
      else stack[stack.length - 1].node.children.push(node);
      stack.push({ depth, node });
    }
    set({ tree: roots });
    setBulk("");
  };

  const flat = flattenTree(config.tree);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Tree editor */}
      <div className="card p-5">
        <h2 className="font-semibold text-ink mb-1">Information architecture</h2>
        <p className="text-sm text-ink/50 mb-4">
          The tree participants will navigate. Every node can be browsed; mark
          correct answers per task on the right.
        </p>
        <TreeEditor
          nodes={config.tree}
          depth={0}
          rename={rename}
          addChild={addChild}
          removeNode={removeNode}
        />
        <button className="btn-secondary mt-3" onClick={() => addChild(null)}>
          + Add top-level item
        </button>

        <div className="mt-5 border-t border-ink/5 pt-4">
          <label className="label">Bulk import (indent with 2 spaces or tabs — replaces current tree)</label>
          <textarea
            className="input min-h-28 font-mono text-xs"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={"Home\n  Products\n    Laptops\n    Phones\n  Support\n    Contact us"}
          />
          <button className="btn-secondary mt-2" onClick={importBulk}>
            Import tree
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div className="card p-5">
        <h2 className="font-semibold text-ink mb-1">
          Tasks ({config.tasks.length})
        </h2>
        <p className="text-sm text-ink/50 mb-4">
          Each task asks the participant to find something in the tree.
        </p>
        <div className="space-y-4">
          {config.tasks.map((task, i) => (
            <div key={task.id} className="border border-ink/10 rounded-lg p-3 space-y-2">
              <div className="flex gap-2 items-start">
                <span className="text-xs font-semibold text-ink/40 mt-2.5 w-5">
                  T{i + 1}
                </span>
                <textarea
                  className="input min-h-16"
                  placeholder="e.g. You want to return a product you bought. Where would you go?"
                  value={task.text}
                  onChange={(e) => {
                    const tasks = [...config.tasks];
                    tasks[i] = { ...task, text: e.target.value };
                    set({ tasks });
                  }}
                />
                <button
                  className="text-ink/40 hover:text-red-500 mt-2"
                  onClick={() =>
                    set({ tasks: config.tasks.filter((t) => t.id !== task.id) })
                  }
                >
                  ✕
                </button>
              </div>
              <div className="pl-7">
                <p className="text-xs font-medium text-ink/60 mb-1">
                  Correct answer(s):
                </p>
                <div className="max-h-40 overflow-y-auto border border-ink/5 rounded-lg p-2 space-y-0.5">
                  {flat.map((f) => (
                    <label
                      key={f.node.id}
                      className="flex items-center gap-2 text-xs text-ink/75 hover:bg-paper rounded px-1 py-0.5 cursor-pointer"
                      style={{ paddingLeft: f.depth * 16 + 4 }}
                    >
                      <input
                        type="checkbox"
                        checked={task.correctNodeIds.includes(f.node.id)}
                        onChange={(e) => {
                          const tasks = [...config.tasks];
                          tasks[i] = {
                            ...task,
                            correctNodeIds: e.target.checked
                              ? [...task.correctNodeIds, f.node.id]
                              : task.correctNodeIds.filter((x) => x !== f.node.id),
                          };
                          set({ tasks });
                        }}
                      />
                      {f.node.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          className="btn-secondary mt-3"
          onClick={() =>
            set({
              tasks: [...config.tasks, { id: cid("t"), text: "", correctNodeIds: [] }],
            })
          }
        >
          + Add task
        </button>
        <label className="flex items-center gap-2 text-sm text-ink/75 mt-4">
          <input
            type="checkbox"
            checked={config.shuffleTasks}
            onChange={(e) => set({ shuffleTasks: e.target.checked })}
          />
          Shuffle task order per participant
        </label>
      </div>
    </div>
  );
}

function TreeEditor({
  nodes,
  depth,
  rename,
  addChild,
  removeNode,
}: {
  nodes: TreeNode[];
  depth: number;
  rename: (id: string, label: string) => void;
  addChild: (parentId: string) => void;
  removeNode: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      {nodes.map((n) => (
        <div key={n.id}>
          <div
            className="flex items-center gap-1.5 group"
            style={{ marginLeft: depth * 20 }}
          >
            <span className="text-ink/25 text-xs">{depth > 0 ? "└" : "•"}</span>
            <input
              className="input !py-1 !px-2 text-sm"
              value={n.label}
              onChange={(e) => rename(n.id, e.target.value)}
            />
            <button
              className="text-xs text-accent opacity-0 group-hover:opacity-100 whitespace-nowrap"
              onClick={() => addChild(n.id)}
              title="Add child"
            >
              + child
            </button>
            <button
              className="text-ink/40 hover:text-red-500 opacity-0 group-hover:opacity-100"
              onClick={() => removeNode(n.id)}
              title="Delete (and children)"
            >
              ✕
            </button>
          </div>
          {n.children.length > 0 && (
            <TreeEditor
              nodes={n.children}
              depth={depth + 1}
              rename={rename}
              addChild={addChild}
              removeNode={removeNode}
            />
          )}
        </div>
      ))}
    </div>
  );
}
