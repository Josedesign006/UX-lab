"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { IconChart, IconEye, IconPlay, IconStop, TypeTile } from "@/components/icons";
import QuestionEditor from "@/components/QuestionEditor";
import CardSortBuilder from "@/components/builders/CardSortBuilder";
import TreeTestBuilder from "@/components/builders/TreeTestBuilder";
import FirstClickBuilder from "@/components/builders/FirstClickBuilder";
import SurveyBuilder from "@/components/builders/SurveyBuilder";
import PrototypeBuilder from "@/components/builders/PrototypeBuilder";
import UsabilityBuilder from "@/components/builders/UsabilityBuilder";
import {
  STUDY_TYPE_META,
  Study,
  StudyConfig,
  StudyStatus,
} from "@/lib/types";

type Tab = "activity" | "questions" | "messages" | "share";

export default function StudyWorkspace() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [study, setStudy] = useState<Study | null>(null);
  const [tab, setTab] = useState<Tab>("activity");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch(`/api/studies/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setStudy(s));
  }, [id]);

  const persist = useCallback(
    (next: Study) => {
      setSaveState("saving");
      fetch(`/api/studies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).then(() => setSaveState("saved"));
    },
    [id]
  );

  const update = useCallback(
    (patch: Partial<Study>) => {
      setStudy((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        setSaveState("dirty");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => persist(next), 600);
        return next;
      });
    },
    [persist]
  );

  if (!study) {
    return (
      <Shell>
        <p className="text-ink/50">Loading…</p>
      </Shell>
    );
  }

  const meta = STUDY_TYPE_META[study.type];
  const shareUrl = `${origin}/p/${study.id}`;

  const setStatus = (status: StudyStatus) => update({ status });

  const remove = async () => {
    if (!confirm(`Delete “${study.name}” and all of its responses?`)) return;
    await fetch(`/api/studies/${id}`, { method: "DELETE" });
    router.push("/");
  };

  return (
    <Shell>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <TypeTile type={study.type} size="lg" />
        <div className="flex-1 min-w-60">
          <input
            className="h-display text-2xl bg-transparent border-b border-transparent hover:border-ink/20 focus:border-ink focus:outline-none w-full"
            value={study.name}
            onChange={(e) => update({ name: e.target.value })}
          />
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45 mt-1.5">
            {meta.label} · <span className="font-semibold">{study.status}</span>{" "}
            ·{" "}
            {saveState === "saved"
              ? "All changes saved"
              : saveState === "saving"
                ? "Saving…"
                : "Unsaved changes"}
          </p>
        </div>
        <div className="flex gap-2">
          {study.status === "draft" && (
            <button className="btn-primary" onClick={() => setStatus("live")}>
              <IconPlay className="w-4 h-4 text-lime" /> Launch study
            </button>
          )}
          {study.status === "live" && (
            <>
              <Link href={`/p/${study.id}`} target="_blank" className="btn-secondary">
                <IconEye className="w-4 h-4" /> Preview
              </Link>
              <button className="btn-secondary" onClick={() => setStatus("closed")}>
                <IconStop className="w-4 h-4" /> Close study
              </button>
            </>
          )}
          {study.status === "closed" && (
            <button className="btn-secondary" onClick={() => setStatus("live")}>
              <IconPlay className="w-4 h-4" /> Re-open
            </button>
          )}
          <Link href={`/studies/${study.id}/results`} className="btn-primary">
            <IconChart className="w-4 h-4 text-lime" /> Results
          </Link>
          <button className="btn-danger" onClick={remove}>
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex gap-1 bg-ink/5 rounded-full p-1 mb-8">
        {(
          [
            ["activity", `${meta.label} setup`],
            ["questions", "Screener & questions"],
            ["messages", "Messages"],
            ["share", "Share & recruit"],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              tab === t
                ? "bg-ink text-white shadow"
                : "text-ink/55 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "activity" && (
        <ActivityBuilder
          study={study}
          onChange={(config) => update({ config })}
        />
      )}

      {tab === "questions" && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="font-semibold text-ink mb-1">Before the activity</h2>
            <p className="text-sm text-ink/50 mb-4">
              Screener and demographic questions shown before the activity starts.
            </p>
            <QuestionEditor
              questions={study.preQuestions}
              onChange={(preQuestions) => update({ preQuestions })}
              emptyHint="No pre-study questions."
            />
          </div>
          <div>
            <h2 className="font-semibold text-ink mb-1">After the activity</h2>
            <p className="text-sm text-ink/50 mb-4">
              Follow-up questions shown after the activity (e.g. SUS, satisfaction).
            </p>
            <QuestionEditor
              questions={study.postQuestions}
              onChange={(postQuestions) => update({ postQuestions })}
              emptyHint="No post-study questions."
            />
          </div>
        </div>
      )}

      {tab === "messages" && (
        <div className="max-w-2xl space-y-5">
          <div>
            <label className="label">Welcome message</label>
            <textarea
              className="input min-h-24"
              value={study.welcomeMessage}
              onChange={(e) => update({ welcomeMessage: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Activity instructions (optional)</label>
            <textarea
              className="input min-h-24"
              placeholder="Shown right before the activity begins."
              value={study.instructions}
              onChange={(e) => update({ instructions: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Thank-you message</label>
            <textarea
              className="input min-h-24"
              value={study.thankYouMessage}
              onChange={(e) => update({ thankYouMessage: e.target.value })}
            />
          </div>
        </div>
      )}

      {tab === "share" && (
        <div className="max-w-2xl space-y-5">
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-2">Participant link</h2>
            <p className="text-sm text-ink/50 mb-3">
              Share this link with participants. The study must be{" "}
              <strong>live</strong> to accept responses.
            </p>
            <div className="flex gap-2">
              <input className="input font-mono text-xs" readOnly value={shareUrl} />
              <button
                className="btn-secondary shrink-0"
                onClick={() => navigator.clipboard.writeText(shareUrl)}
              >
                Copy
              </button>
            </div>
            {study.status !== "live" && (
              <p className="text-sm text-amber-600 mt-3">
                This study is {study.status}. Launch it to start collecting
                responses.
              </p>
            )}
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-2">Tips for recruiting</h2>
            <ul className="text-sm text-ink/60 list-disc pl-5 space-y-1">
              <li>Card sorts: aim for 15–30 participants for stable patterns.</li>
              <li>Tree tests &amp; first-click: 30–50 gives reliable success metrics.</li>
              <li>Pilot the study yourself with Preview before sharing widely.</li>
            </ul>
          </div>
        </div>
      )}
    </Shell>
  );
}

function ActivityBuilder({
  study,
  onChange,
}: {
  study: Study;
  onChange: (c: StudyConfig) => void;
}) {
  switch (study.config.kind) {
    case "card-sort":
      return <CardSortBuilder config={study.config} onChange={onChange} />;
    case "tree-test":
      return <TreeTestBuilder config={study.config} onChange={onChange} />;
    case "first-click":
      return <FirstClickBuilder config={study.config} onChange={onChange} />;
    case "survey":
      return <SurveyBuilder config={study.config} onChange={onChange} />;
    case "prototype":
      return <PrototypeBuilder config={study.config} onChange={onChange} />;
    case "usability":
      return <UsabilityBuilder config={study.config} onChange={onChange} />;
  }
}
