"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import {
  IconChart,
  IconEye,
  IconPlay,
  IconStop,
  IconTrash,
  TypeTile,
} from "@/components/icons";
import QuestionEditor from "@/components/QuestionEditor";
import CardSortBuilder from "@/components/builders/CardSortBuilder";
import TreeTestBuilder from "@/components/builders/TreeTestBuilder";
import FirstClickBuilder from "@/components/builders/FirstClickBuilder";
import SurveyBuilder from "@/components/builders/SurveyBuilder";
import PrototypeBuilder from "@/components/builders/PrototypeBuilder";
import UsabilityBuilder from "@/components/builders/UsabilityBuilder";
import CognitiveWalkthroughBuilder from "@/components/builders/CognitiveWalkthroughBuilder";
import {
  STUDY_TYPE_META,
  Study,
  StudyConfig,
  StudyStatus,
} from "@/lib/types";

type Tab = "activity" | "questions" | "messages" | "share";

export default function StudyWorkspace({
  initialStudy,
}: {
  initialStudy: Study;
}) {
  const id = initialStudy.id;
  const router = useRouter();
  // Seeded from server-rendered data — no client fetch waterfall on open.
  const [study, setStudy] = useState<Study>(initialStudy);
  const [tab, setTab] = useState<Tab>("activity");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [origin, setOrigin] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const persist = useCallback(
    (next: Study) => {
      setSaveState("saving");
      return fetch(`/api/studies/${id}`, {
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
        const next = { ...prev, ...patch };
        setSaveState("dirty");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => persist(next), 600);
        return next;
      });
    },
    [persist]
  );

  const meta = STUDY_TYPE_META[study.type];
  const shareUrl = `${origin}/p/${study.id}`;

  // Status changes (launch/close/reopen) save immediately — never debounced —
  // so the participant link reflects the new status the moment the click
  // returns, instead of after the 600ms autosave window.
  const setStatus = (status: StudyStatus) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setStatusBusy(true);
    setStudy((prev) => {
      const next = { ...prev, status };
      persist(next).finally(() => setStatusBusy(false));
      return next;
    });
  };

  const remove = async () => {
    setDeleting(true);
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
            <button
              className="btn-primary"
              onClick={() => setStatus("live")}
              disabled={statusBusy}
            >
              <IconPlay className="w-4 h-4 text-lime" />{" "}
              {statusBusy ? "Launching…" : "Launch study"}
            </button>
          )}
          {study.status === "live" && (
            <>
              {/* Only linkable once the live status is actually persisted —
                  otherwise the participant page may still read "draft". */}
              {statusBusy ? (
                <span className="btn-secondary opacity-60 cursor-wait">
                  <IconEye className="w-4 h-4" /> Preparing…
                </span>
              ) : (
                <Link href={`/p/${study.id}`} target="_blank" className="btn-secondary">
                  <IconEye className="w-4 h-4" /> Preview
                </Link>
              )}
              <button
                className="btn-secondary"
                onClick={() => setStatus("closed")}
                disabled={statusBusy}
              >
                <IconStop className="w-4 h-4" /> Close study
              </button>
            </>
          )}
          {study.status === "closed" && (
            <button
              className="btn-secondary"
              onClick={() => setStatus("live")}
              disabled={statusBusy}
            >
              <IconPlay className="w-4 h-4" />{" "}
              {statusBusy ? "Re-opening…" : "Re-open"}
            </button>
          )}
          <Link href={`/studies/${study.id}/results`} className="btn-primary">
            <IconChart className="w-4 h-4 text-lime" /> Results
          </Link>
          <button className="btn-danger" onClick={() => setConfirmingDelete(true)}>
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
              <li>Cognitive walkthroughs: 3–5 evaluators (ideally UX-literate) surface most learnability issues.</li>
              <li>Pilot the study yourself with Preview before sharing widely.</li>
            </ul>
          </div>
        </div>
      )}

      {confirmingDelete && (
        <DeleteModal
          studyName={study.name}
          deleting={deleting}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={remove}
        />
      )}
    </Shell>
  );
}

function DeleteModal({
  studyName,
  deleting,
  onCancel,
  onConfirm,
}: {
  studyName: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deleting, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink/40 backdrop-blur-sm animate-[fadeIn_120ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-study-title"
      onClick={() => !deleting && onCancel()}
    >
      <div
        className="card p-7 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="w-12 h-12 rounded-xl bg-red-50 text-red-600 grid place-items-center mb-5">
          <IconTrash className="w-6 h-6" />
        </span>
        <h2 id="delete-study-title" className="h-display text-xl mb-2">
          Delete this study?
        </h2>
        <p className="text-sm text-ink/55 mb-7">
          “{studyName}” and all of its collected responses will be permanently
          deleted. This can’t be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="btn bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]"
            onClick={onConfirm}
            disabled={deleting}
            autoFocus
          >
            {deleting ? "Deleting…" : "Delete study"}
          </button>
        </div>
      </div>
    </div>
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
    case "cognitive-walkthrough":
      return (
        <CognitiveWalkthroughBuilder config={study.config} onChange={onChange} />
      );
  }
}
