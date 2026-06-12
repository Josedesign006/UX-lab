"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CardSortConfig, CardSortGroup, ResultData } from "@/lib/types";

/**
 * Pointer-event based drag & drop (HTML5 DnD breaks when React re-renders the
 * source element on dragstart, and never works on touch). A ghost follows the
 * pointer; the zone under the pointer is resolved via elementFromPoint.
 */
export default function CardSortActivity({
  config,
  instructions,
  onDone,
}: {
  config: CardSortConfig;
  instructions: string;
  onDone: (d: ResultData) => void;
}) {
  const cards = useMemo(() => {
    const list = [...config.cards];
    if (config.shuffleCards) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [unsorted, setUnsorted] = useState<string[]>(cards.map((c) => c.id));
  const [groups, setGroups] = useState<CardSortGroup[]>(() =>
    config.sortType === "open"
      ? []
      : config.categories.map((cat) => ({
          categoryId: cat.id,
          name: cat.label,
          cardIds: [],
        }))
  );
  const [error, setError] = useState<string | null>(null);

  // ---- drag state ----
  const [drag, setDrag] = useState<{
    cardId: string;
    x: number;
    y: number;
    started: boolean;
  } | null>(null);
  const [hoverZone, setHoverZone] = useState<string | null>(null);
  const dragRef = useRef<typeof drag>(null);
  dragRef.current = drag;
  const startPos = useRef({ x: 0, y: 0 });

  const cardById = useMemo(
    () => new Map(config.cards.map((c) => [c.id, c])),
    [config.cards]
  );

  const moveCard = (cardId: string, zone: string) => {
    setUnsorted((u) => u.filter((id) => id !== cardId));
    setGroups((gs) =>
      gs.map((g) => ({ ...g, cardIds: g.cardIds.filter((id) => id !== cardId) }))
    );
    if (zone === "unsorted") {
      setUnsorted((u) => [...u, cardId]);
    } else {
      const idx = Number(zone);
      setGroups((gs) =>
        gs.map((g, i) => (i === idx ? { ...g, cardIds: [...g.cardIds, cardId] } : g))
      );
    }
    setError(null);
  };

  // global pointer listeners while dragging
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      const started = d.started || Math.hypot(dx, dy) > 5;
      setDrag({ ...d, x: e.clientX, y: e.clientY, started });
      if (started) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const zoneEl = el?.closest("[data-zone]") as HTMLElement | null;
        setHoverZone(zoneEl?.dataset.zone ?? null);
      }
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (d?.started) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const zoneEl = el?.closest("[data-zone]") as HTMLElement | null;
        if (zoneEl?.dataset.zone) moveCard(d.cardId, zoneEl.dataset.zone);
      }
      setDrag(null);
      setHoverZone(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null]);

  const beginDrag = (cardId: string) => (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    startPos.current = { x: e.clientX, y: e.clientY };
    setDrag({ cardId, x: e.clientX, y: e.clientY, started: false });
  };

  const addGroup = () =>
    setGroups((gs) => [...gs, { categoryId: null, name: "", cardIds: [] }]);

  const finish = () => {
    if (config.requireAllCards && unsorted.length > 0) {
      setError(`Please sort all cards — ${unsorted.length} remaining.`);
      return;
    }
    const used = groups.filter((g) => g.cardIds.length > 0);
    if (used.length === 0) {
      setError("Please sort cards into at least one group.");
      return;
    }
    if (used.some((g) => g.categoryId === null && !g.name.trim())) {
      setError("Please name all of your groups.");
      return;
    }
    onDone({ groups: used, unsortedCardIds: unsorted });
  };

  const canAddGroups = config.sortType !== "closed";
  const dragging = drag?.started ? drag.cardId : null;
  const draggedCard = dragging ? cardById.get(dragging) : null;

  const Card = ({ id }: { id: string }) => {
    const card = cardById.get(id);
    if (!card) return null;
    return (
      <div
        onPointerDown={beginDrag(id)}
        className={`bg-white border border-ink/10 rounded-xl px-3.5 py-2.5 text-sm shadow-sm cursor-grab select-none touch-none transition-shadow hover:shadow-md hover:border-ink/25 ${
          dragging === id ? "opacity-30" : ""
        }`}
      >
        <span className="font-medium text-ink">{card.label}</span>
        {card.description && (
          <span className="block text-xs text-ink/50 mt-0.5">{card.description}</span>
        )}
      </div>
    );
  };

  const zoneCls = (zone: string, base: string) =>
    `${base} transition-colors ${
      hoverZone === zone && dragging ? "ring-2 ring-ink bg-lime/30" : ""
    }`;

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-paper/90 backdrop-blur border-b border-ink/10 px-6 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 justify-between">
          <p className="text-sm text-ink/70 max-w-2xl">
            {instructions ||
              "Drag the cards into groups that make sense to you." +
                (config.sortType !== "closed"
                  ? " You can create and name your own groups."
                  : "")}
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-ink/50 tabular-nums uppercase tracking-wider">
              {config.cards.length - unsorted.length}/{config.cards.length} sorted
            </span>
            <button className="btn-primary" onClick={finish}>
              Finished ✓
            </button>
          </div>
        </div>
        {error && (
          <p className="max-w-7xl mx-auto text-sm text-red-600 mt-1">{error}</p>
        )}
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6 items-start">
        {/* Unsorted pile */}
        <div
          data-zone="unsorted"
          className={zoneCls(
            "unsorted",
            "bg-ink/5 rounded-2xl p-3 space-y-2 min-h-64 md:sticky md:top-20"
          )}
        >
          <p className="eyebrow px-1 pt-1">Cards · {unsorted.length}</p>
          {unsorted.map((id) => (
            <Card key={id} id={id} />
          ))}
          {unsorted.length === 0 && (
            <p className="text-xs text-ink/40 px-1">All cards sorted ✓</p>
          )}
        </div>

        {/* Groups */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {groups.map((g, i) => (
            <div
              key={i}
              data-zone={String(i)}
              className={zoneCls(
                String(i),
                "bg-white rounded-2xl border border-ink/10 p-3 min-h-44 space-y-2"
              )}
            >
              {g.categoryId ? (
                <p className="font-semibold text-sm text-ink px-1 pt-1">{g.name}</p>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    className="input !py-1.5 text-sm font-medium"
                    placeholder="Name this group…"
                    value={g.name}
                    onChange={(e) =>
                      setGroups((gs) =>
                        gs.map((x, k) =>
                          k === i ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                  />
                  {g.cardIds.length === 0 && (
                    <button
                      className="text-ink/30 hover:text-red-500 px-1"
                      onClick={() =>
                        setGroups((gs) => gs.filter((_, k) => k !== i))
                      }
                      title="Remove group"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              {g.cardIds.map((id) => (
                <Card key={id} id={id} />
              ))}
              {g.cardIds.length === 0 && (
                <p className="text-xs text-ink/25 px-1 py-5 text-center border border-dashed border-ink/15 rounded-xl">
                  Drop cards here
                </p>
              )}
            </div>
          ))}
          {canAddGroups && (
            <button
              onClick={addGroup}
              className="border-2 border-dashed border-ink/15 rounded-2xl min-h-44 text-sm text-ink/50 hover:border-ink hover:text-ink transition-colors"
            >
              + Add a group
            </button>
          )}
        </div>
      </div>

      {/* drag ghost */}
      {drag?.started && draggedCard && (
        <div
          className="fixed z-50 pointer-events-none bg-ink text-white rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-xl rotate-2"
          style={{ left: drag.x + 10, top: drag.y + 8, maxWidth: 220 }}
        >
          {draggedCard.label}
        </div>
      )}
    </div>
  );
}
