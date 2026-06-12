"use client";

import { useState } from "react";

export interface MapClick {
  x: number;
  y: number;
  label?: string;
  /** e.g. misclick coloring */
  color?: string;
}

/** Image with click overlay: dot view or heat view. */
export default function ClickMap({ image, clicks }: { image: string; clicks: MapClick[] }) {
  const [mode, setMode] = useState<"dots" | "heat">("heat");

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {(["heat", "dots"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${
              mode === m ? "bg-ink text-white" : "bg-ink/5 text-ink/60"
            }`}
          >
            {m === "heat" ? "Heatmap" : "Click dots"}
          </button>
        ))}
        <span className="text-xs text-ink/40 self-center ml-2">
          {clicks.length} click{clicks.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="relative inline-block max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt="Design"
          className="max-w-full rounded-lg border border-ink/10"
        />
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {mode === "heat" ? (
            <>
              <defs>
                <radialGradient id="heatdot">
                  <stop offset="0%" stopColor="rgba(239,68,68,0.55)" />
                  <stop offset="60%" stopColor="rgba(249,115,22,0.30)" />
                  <stop offset="100%" stopColor="rgba(249,115,22,0)" />
                </radialGradient>
              </defs>
              {clicks.map((c, i) => (
                <circle
                  key={i}
                  cx={`${c.x * 100}%`}
                  cy={`${c.y * 100}%`}
                  r={34}
                  fill="url(#heatdot)"
                />
              ))}
            </>
          ) : (
            clicks.map((c, i) => (
              <circle
                key={i}
                cx={`${c.x * 100}%`}
                cy={`${c.y * 100}%`}
                r={6}
                fill={c.color ?? "#4f46e5"}
                fillOpacity={0.75}
                stroke="white"
                strokeWidth={1.5}
              >
                <title>{c.label}</title>
              </circle>
            ))
          )}
        </svg>
      </div>
    </div>
  );
}
