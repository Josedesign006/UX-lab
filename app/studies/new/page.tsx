"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { StudyTypeIcon } from "@/components/icons";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";

const TYPES = Object.keys(STUDY_TYPE_META) as StudyType[];

export default function NewStudy() {
  const router = useRouter();
  const [type, setType] = useState<StudyType>("card-sort");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const res = await fetch("/api/studies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        name:
          name.trim() ||
          `Untitled ${STUDY_TYPE_META[type].label.toLowerCase()}`,
      }),
    });
    const study = await res.json();
    router.push(`/studies/${study.id}`);
  };

  return (
    <Shell>
      <p className="eyebrow mb-3">New study</p>
      <h1 className="h-display text-4xl mb-10">Pick a method.</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {TYPES.map((t) => {
          const meta = STUDY_TYPE_META[t];
          const active = type === t;
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`card p-6 text-left transition-all duration-150 ${
                active
                  ? "!bg-ink text-white -translate-y-1 shadow-xl"
                  : "hover:-translate-y-1 hover:shadow-lg"
              }`}
            >
              <span
                className={`w-12 h-12 rounded-xl grid place-items-center mb-4 transition-colors ${
                  active ? "bg-lime text-ink" : "bg-ink text-lime"
                }`}
              >
                <StudyTypeIcon type={t} className="w-6 h-6" />
              </span>
              <p
                className={`font-semibold tracking-tight text-lg ${
                  active ? "text-lime" : "text-ink"
                }`}
              >
                {meta.label}
              </p>
              <p
                className={`text-sm mt-1.5 leading-snug ${
                  active ? "text-white/70" : "text-ink/50"
                }`}
              >
                {meta.tagline}
              </p>
            </button>
          );
        })}
      </div>
      <div className="card p-6 max-w-xl">
        <label className="label">Study name</label>
        <input
          className="input"
          placeholder={`e.g. ${STUDY_TYPE_META[type].label} — Q3 navigation`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        <button className="btn-primary mt-5" onClick={create} disabled={busy}>
          {busy ? "Creating…" : "Create study →"}
        </button>
      </div>
    </Shell>
  );
}
