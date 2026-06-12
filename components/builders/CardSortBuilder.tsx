"use client";

import { useState } from "react";
import { cid } from "@/lib/id";
import { CardSortConfig, CardSortKind } from "@/lib/types";

export default function CardSortBuilder({
  config,
  onChange,
}: {
  config: CardSortConfig;
  onChange: (c: CardSortConfig) => void;
}) {
  const [bulk, setBulk] = useState("");

  const set = (patch: Partial<CardSortConfig>) => onChange({ ...config, ...patch });

  const addBulk = () => {
    const labels = bulk
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!labels.length) return;
    set({
      cards: [...config.cards, ...labels.map((label) => ({ id: cid("c"), label }))],
    });
    setBulk("");
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="card p-5">
          <h2 className="font-semibold text-ink mb-3">Sort type</h2>
          <div className="space-y-2">
            {(
              [
                ["open", "Open", "Participants create and name their own groups"],
                ["closed", "Closed", "Participants sort into categories you define"],
                ["hybrid", "Hybrid", "Your categories, plus participants can add their own"],
              ] as [CardSortKind, string, string][]
            ).map(([v, label, desc]) => (
              <label
                key={v}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                  config.sortType === v
                    ? "border-ink bg-lime/25"
                    : "border-ink/10 hover:border-ink/20"
                }`}
              >
                <input
                  type="radio"
                  className="mt-1"
                  checked={config.sortType === v}
                  onChange={() => set({ sortType: v })}
                />
                <span>
                  <span className="font-medium text-ink block text-sm">{label}</span>
                  <span className="text-xs text-ink/50">{desc}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-sm text-ink/75">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.shuffleCards}
                onChange={(e) => set({ shuffleCards: e.target.checked })}
              />
              Shuffle card order per participant
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.requireAllCards}
                onChange={(e) => set({ requireAllCards: e.target.checked })}
              />
              Require all cards to be sorted
            </label>
          </div>
        </div>

        {config.sortType !== "open" && (
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-3">
              Categories ({config.categories.length})
            </h2>
            <div className="space-y-1.5">
              {config.categories.map((cat, i) => (
                <div key={cat.id} className="flex gap-2">
                  <input
                    className="input"
                    value={cat.label}
                    onChange={(e) => {
                      const categories = [...config.categories];
                      categories[i] = { ...cat, label: e.target.value };
                      set({ categories });
                    }}
                  />
                  <button
                    className="text-ink/40 hover:text-red-500 px-1"
                    onClick={() =>
                      set({ categories: config.categories.filter((c) => c.id !== cat.id) })
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              className="text-sm text-accent hover:underline mt-2"
              onClick={() =>
                set({
                  categories: [
                    ...config.categories,
                    { id: cid("g"), label: `Category ${config.categories.length + 1}` },
                  ],
                })
              }
            >
              + Add category
            </button>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-ink mb-3">
          Cards ({config.cards.length})
        </h2>
        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {config.cards.map((card, i) => (
            <div key={card.id} className="flex gap-2">
              <input
                className="input"
                value={card.label}
                placeholder="Card label"
                onChange={(e) => {
                  const cards = [...config.cards];
                  cards[i] = { ...card, label: e.target.value };
                  set({ cards });
                }}
              />
              <input
                className="input"
                value={card.description ?? ""}
                placeholder="Description (optional)"
                onChange={(e) => {
                  const cards = [...config.cards];
                  cards[i] = { ...card, description: e.target.value };
                  set({ cards });
                }}
              />
              <button
                className="text-ink/40 hover:text-red-500 px-1"
                onClick={() => set({ cards: config.cards.filter((c) => c.id !== card.id) })}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn-secondary mt-3"
          onClick={() =>
            set({ cards: [...config.cards, { id: cid("c"), label: "" }] })
          }
        >
          + Add card
        </button>
        <div className="mt-5 border-t border-ink/5 pt-4">
          <label className="label">Bulk add (one card per line)</label>
          <textarea
            className="input min-h-20 font-mono text-xs"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={"Pricing\nContact us\nShipping policy"}
          />
          <button className="btn-secondary mt-2" onClick={addBulk}>
            Add cards
          </button>
        </div>
      </div>
    </div>
  );
}
