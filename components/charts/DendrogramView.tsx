"use client";

import { useState } from "react";
import Dendrogram from "./Dendrogram";
import { DendroNode } from "@/lib/analysis";

/**
 * Optimal-Workshop-style dual dendrograms:
 * - AAM (actual agreement): % of participants who grouped the whole cluster
 *   together in one group. Conservative, only real agreement.
 * - BMM (best merge, average linkage): pairwise average similarity — finds
 *   patterns even when no two participants sorted identically.
 */
export default function DendrogramView({
  aam,
  bmm,
  labels,
}: {
  aam: DendroNode;
  bmm: DendroNode;
  labels: string[];
}) {
  const [method, setMethod] = useState<"aam" | "bmm">("aam");
  const [threshold, setThreshold] = useState(60);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="inline-flex gap-1 bg-ink/5 rounded-full p-1">
          {(
            [
              ["aam", "Actual agreement (AAM)"],
              ["bmm", "Best merge (BMM)"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all ${
                method === m ? "bg-ink text-white" : "text-ink/55 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-ink/60">
          Highlight clusters ≥
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="accent-ink"
          />
          <span className="font-mono font-semibold text-ink w-9">{threshold}%</span>
        </label>
      </div>
      <p className="text-xs text-ink/45 mb-3 max-w-2xl">
        {method === "aam"
          ? "Actual Agreement Method — a cluster's score is the % of participants who placed every card of that cluster together in one group. Only shows agreement that literally happened."
          : "Best Merge Method (average linkage) — merges by average pairwise similarity, surfacing patterns even when no two participants sorted identically. More speculative, better for small samples."}
      </p>
      <div className="overflow-x-auto">
        <Dendrogram
          root={method === "aam" ? aam : bmm}
          labels={labels}
          threshold={threshold}
        />
      </div>
    </div>
  );
}
