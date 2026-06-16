"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconClock,
  IconSearch,
  IconUsers,
  TypeTile,
} from "@/components/icons";
import { STUDY_TYPE_META, StudyStatus, StudyType } from "@/lib/types";

export interface DashStudy {
  id: string;
  type: StudyType;
  name: string;
  status: StudyStatus;
  updatedAt: string;
  responses: number;
  week: number;
  lastAt: string | null;
  avgMs: number | null;
  /** recommended sample size for this method */
  target: number;
}

const STATUS_STYLES: Record<StudyStatus, string> = {
  draft: "bg-ink/5 text-ink/60",
  live: "bg-lime text-ink",
  closed: "bg-amber-100 text-amber-800",
};

type Sort = "recent" | "responses" | "name";
type Filter = "all" | StudyStatus;

function ago(iso: string | null): string {
  if (!iso) return "No responses yet";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Active just now";
  if (min < 60) return `Active ${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Active ${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `Active ${day}d ago`;
  return `Active ${Math.floor(day / 30)}mo ago`;
}

export default function StudyBoard({ studies }: { studies: DashStudy[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");

  const counts = useMemo(
    () => ({
      all: studies.length,
      live: studies.filter((s) => s.status === "live").length,
      draft: studies.filter((s) => s.status === "draft").length,
      closed: studies.filter((s) => s.status === "closed").length,
    }),
    [studies]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return studies
      .filter((s) => filter === "all" || s.status === filter)
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          STUDY_TYPE_META[s.type].label.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sort === "responses") return b.responses - a.responses;
        if (sort === "name") return a.name.localeCompare(b.name);
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [studies, query, filter, sort]);

  const filters: { key: Filter; label: string; n: number }[] = [
    { key: "all", label: "All", n: counts.all },
    { key: "live", label: "Live", n: counts.live },
    { key: "draft", label: "Drafts", n: counts.draft },
    { key: "closed", label: "Closed", n: counts.closed },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-52">
          <IconSearch className="w-4 h-4 text-ink/35 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            className="input !pl-10"
            placeholder="Search studies…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="inline-flex gap-1 bg-ink/5 rounded-full p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-all ${
                filter === f.key
                  ? "bg-ink text-white shadow"
                  : "text-ink/55 hover:text-ink"
              }`}
            >
              {f.label}{" "}
              <span
                className={filter === f.key ? "text-lime" : "text-ink/35"}
              >
                {f.n}
              </span>
            </button>
          ))}
        </div>
        <select
          className="input !w-auto !py-2 cursor-pointer"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
        >
          <option value="recent">Most recent</option>
          <option value="responses">Most responses</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      {/* List */}
      {shown.length === 0 ? (
        <div className="card p-12 text-center text-sm text-ink/50">
          No studies match your filters.
        </div>
      ) : (
        <div className="card divide-y divide-ink/5 overflow-hidden">
          {shown.map((s) => {
            const meta = STUDY_TYPE_META[s.type];
            const pct = Math.min(100, Math.round((s.responses / s.target) * 100));
            return (
              <Link
                key={s.id}
                href={`/studies/${s.id}`}
                className="group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_minmax(0,1fr)_180px_120px_auto_auto] items-center gap-x-5 gap-y-2 px-6 py-5 hover:bg-paper/60 transition-colors"
              >
                <TypeTile type={s.type} />

                <div className="min-w-0">
                  <p className="font-semibold text-ink tracking-tight truncate text-lg">
                    {s.name}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/40 mt-0.5">
                    {meta.label} · updated{" "}
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] text-ink/45 mt-1 sm:hidden">
                    <IconClock className="w-3 h-3" /> {ago(s.lastAt)}
                  </p>
                </div>

                {/* Sample-size progress */}
                <div className="hidden sm:block">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40">
                      Sample
                    </span>
                    <span className="font-mono text-[11px] text-ink/55 tabular-nums">
                      {s.responses}
                      <span className="text-ink/30">/{s.target}</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink/8 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 100 ? "bg-lime" : "bg-ink/70"
                      }`}
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                  <p className="flex items-center gap-1.5 text-[11px] text-ink/45 mt-1.5">
                    <IconClock className="w-3 h-3" /> {ago(s.lastAt)}
                  </p>
                </div>

                {/* Responses + momentum */}
                <div className="hidden sm:block text-right">
                  <p className="font-mono text-lg font-semibold text-ink tabular-nums leading-none">
                    {s.responses}
                  </p>
                  <p className="text-[11px] text-ink/40 mt-1">responses</p>
                  {s.week > 0 && (
                    <span className="inline-block bg-lime text-ink font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1.5">
                      +{s.week} this week
                    </span>
                  )}
                </div>

                {/* mobile responses */}
                <span className="sm:hidden inline-flex items-center gap-1 font-mono text-sm text-ink/60 tabular-nums">
                  <IconUsers className="w-3.5 h-3.5 text-ink/35" />
                  {s.responses}
                </span>

                <span
                  className={`justify-self-end font-mono text-[10px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-[0.12em] ${STATUS_STYLES[s.status]}`}
                >
                  {s.status}
                </span>

                <IconArrowRight className="hidden sm:block w-4 h-4 text-ink/25 group-hover:text-ink group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
