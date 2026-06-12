"use client";

import { useRef, useState } from "react";
import { cid } from "@/lib/id";
import { fileToDataUrl } from "@/lib/image";
import { Hotspot, PrototypeConfig, PrototypeScreen } from "@/lib/types";

export default function PrototypeBuilder({
  config,
  onChange,
}: {
  config: PrototypeConfig;
  onChange: (c: PrototypeConfig) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    config.screens[0]?.id ?? null
  );
  const set = (patch: Partial<PrototypeConfig>) => onChange({ ...config, ...patch });
  const selected = config.screens.find((s) => s.id === selectedId) ?? null;

  const updateScreen = (id: string, patch: Partial<PrototypeScreen>) =>
    set({
      screens: config.screens.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const addScreens = async (files: FileList | null) => {
    if (!files?.length) return;
    const newScreens: PrototypeScreen[] = [];
    for (const file of Array.from(files)) {
      const image = await fileToDataUrl(file);
      newScreens.push({
        id: cid("scr"),
        name: file.name.replace(/\.[^.]+$/, ""),
        image,
        hotspots: [],
      });
    }
    const screens = [...config.screens, ...newScreens];
    set({ screens });
    if (!selectedId) setSelectedId(screens[0].id);
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Screen list */}
        <div className="card p-4">
          <h2 className="font-semibold text-ink mb-3">
            Screens ({config.screens.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {config.screens.map((s) => (
              <div
                key={s.id}
                className={`rounded-lg border p-2 cursor-pointer ${
                  s.id === selectedId
                    ? "border-ink ring-1 ring-lime"
                    : "border-ink/10 hover:border-ink/20"
                }`}
                onClick={() => setSelectedId(s.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.name} className="rounded w-full mb-1.5" />
                <div className="flex items-center gap-1">
                  <input
                    className="text-xs font-medium text-ink/75 bg-transparent flex-1 focus:outline-none"
                    value={s.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateScreen(s.id, { name: e.target.value })}
                  />
                  <button
                    className="text-ink/40 hover:text-red-500 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      const screens = config.screens.filter((x) => x.id !== s.id);
                      set({ screens });
                      if (selectedId === s.id) setSelectedId(screens[0]?.id ?? null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <label className="block border-2 border-dashed border-ink/20 rounded-lg p-4 mt-3 text-center text-xs text-ink/50 cursor-pointer hover:border-ink">
            + Upload screen(s)
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addScreens(e.target.files)}
            />
          </label>
        </div>

        {/* Hotspot editor */}
        <div className="card p-4">
          <h2 className="font-semibold text-ink mb-1">Hotspots</h2>
          <p className="text-sm text-ink/50 mb-3">
            Drag on the screen to draw a clickable area, then choose where it
            links to.
          </p>
          {selected ? (
            <HotspotEditor
              key={selected.id}
              screen={selected}
              screens={config.screens}
              onChange={(hotspots) => updateScreen(selected.id, { hotspots })}
            />
          ) : (
            <p className="text-sm text-ink/40 py-12 text-center">
              Upload and select a screen to add hotspots.
            </p>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="card p-5 max-w-3xl">
        <h2 className="font-semibold text-ink mb-3">
          Tasks ({config.tasks.length})
        </h2>
        <div className="space-y-3">
          {config.tasks.map((task, i) => (
            <div key={task.id} className="border border-ink/10 rounded-lg p-3 space-y-2">
              <div className="flex gap-2 items-start">
                <span className="text-xs font-semibold text-ink/40 mt-2.5 w-5">
                  T{i + 1}
                </span>
                <textarea
                  className="input min-h-14"
                  placeholder="e.g. Starting from the home screen, purchase the blue sneakers."
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
              <div className="pl-7 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink/60 block mb-1">
                    Start screen
                  </label>
                  <select
                    className="input"
                    value={task.startScreenId}
                    onChange={(e) => {
                      const tasks = [...config.tasks];
                      tasks[i] = { ...task, startScreenId: e.target.value };
                      set({ tasks });
                    }}
                  >
                    <option value="">— choose —</option>
                    {config.screens.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink/60 block mb-1">
                    Goal screen(s) — reaching one completes the task
                  </label>
                  <div className="border border-ink/10 rounded-lg p-2 max-h-28 overflow-y-auto space-y-0.5">
                    {config.screens.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-xs text-ink/75">
                        <input
                          type="checkbox"
                          checked={task.goalScreenIds.includes(s.id)}
                          onChange={(e) => {
                            const tasks = [...config.tasks];
                            tasks[i] = {
                              ...task,
                              goalScreenIds: e.target.checked
                                ? [...task.goalScreenIds, s.id]
                                : task.goalScreenIds.filter((x) => x !== s.id),
                            };
                            set({ tasks });
                          }}
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          className="btn-secondary mt-3"
          onClick={() =>
            set({
              tasks: [
                ...config.tasks,
                {
                  id: cid("t"),
                  text: "",
                  startScreenId: config.screens[0]?.id ?? "",
                  goalScreenIds: [],
                },
              ],
            })
          }
        >
          + Add task
        </button>
      </div>
    </div>
  );
}

function HotspotEditor({
  screen,
  screens,
  onChange,
}: {
  screen: PrototypeScreen;
  screens: PrototypeScreen[];
  onChange: (hotspots: Hotspot[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(
    null
  );

  const norm = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const onDown = (e: React.MouseEvent) => {
    const p = norm(e);
    setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const onMove = (e: React.MouseEvent) => {
    if (!draft) return;
    const p = norm(e);
    setDraft({ ...draft, x1: p.x, y1: p.y });
  };
  const onUp = () => {
    if (!draft) return;
    const x = Math.min(draft.x0, draft.x1);
    const y = Math.min(draft.y0, draft.y1);
    const w = Math.abs(draft.x1 - draft.x0);
    const h = Math.abs(draft.y1 - draft.y0);
    setDraft(null);
    if (w < 0.01 || h < 0.01) return; // ignore accidental clicks
    onChange([
      ...screen.hotspots,
      { id: cid("h"), x, y, w, h, targetScreenId: "" },
    ]);
  };

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className="relative select-none cursor-crosshair inline-block max-w-full"
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={() => setDraft(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={screen.image} alt={screen.name} className="max-w-full rounded-lg border border-ink/10 pointer-events-none" />
        {screen.hotspots.map((h, i) => (
          <div
            key={h.id}
            className="absolute border-2 border-accent bg-accent/20 rounded grid place-items-center text-[10px] font-bold text-ink"
            style={{
              left: `${h.x * 100}%`,
              top: `${h.y * 100}%`,
              width: `${h.w * 100}%`,
              height: `${h.h * 100}%`,
            }}
          >
            {i + 1}
          </div>
        ))}
        {draft && (
          <div
            className="absolute border-2 border-dashed border-accent bg-accent/10"
            style={{
              left: `${Math.min(draft.x0, draft.x1) * 100}%`,
              top: `${Math.min(draft.y0, draft.y1) * 100}%`,
              width: `${Math.abs(draft.x1 - draft.x0) * 100}%`,
              height: `${Math.abs(draft.y1 - draft.y0) * 100}%`,
            }}
          />
        )}
      </div>

      {screen.hotspots.length > 0 && (
        <div className="space-y-1.5">
          {screen.hotspots.map((h, i) => (
            <div key={h.id} className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded bg-ink/10 text-ink text-xs font-bold grid place-items-center shrink-0">
                {i + 1}
              </span>
              <span className="text-ink/50 text-xs">links to</span>
              <select
                className="input !w-56"
                value={h.targetScreenId}
                onChange={(e) =>
                  onChange(
                    screen.hotspots.map((x) =>
                      x.id === h.id ? { ...x, targetScreenId: e.target.value } : x
                    )
                  )
                }
              >
                <option value="">— choose target screen —</option>
                {screens
                  .filter((s) => s.id !== screen.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <button
                className="text-ink/40 hover:text-red-500"
                onClick={() => onChange(screen.hotspots.filter((x) => x.id !== h.id))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
