"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import QuestionForm from "@/components/QuestionForm";
import Center from "@/components/participant/Center";
import { IconCheck, IconLock } from "@/components/icons";
import CardSortActivity from "@/components/participant/CardSortActivity";
import TreeTestActivity from "@/components/participant/TreeTestActivity";
import FirstClickActivity from "@/components/participant/FirstClickActivity";
import PrototypeActivity from "@/components/participant/PrototypeActivity";
import UsabilityActivity from "@/components/participant/UsabilityActivity";
import CognitiveWalkthroughActivity from "@/components/participant/CognitiveWalkthroughActivity";
import { Answer, ResultData, Study, SurveyConfig } from "@/lib/types";

type Stage = "loading" | "unavailable" | "welcome" | "pre" | "activity" | "post" | "submitting" | "done";

export default function ParticipantFlow() {
  const { id } = useParams<{ id: string }>();
  const [study, setStudy] = useState<Study | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const startedAt = useRef(new Date().toISOString());
  const startMs = useRef(Date.now());
  const preAnswers = useRef<Answer[]>([]);
  const activityData = useRef<ResultData | null>(null);

  useEffect(() => {
    fetch(`/api/studies/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s: Study | null) => {
        if (!s || s.status !== "live") {
          setStudy(s);
          setStage("unavailable");
        } else {
          setStudy(s);
          setStage("welcome");
        }
      });
  }, [id]);

  const submit = async (postAnswers: Answer[]) => {
    setStage("submitting");
    await fetch(`/api/studies/${id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startedAt: startedAt.current,
        durationMs: Date.now() - startMs.current,
        preAnswers: preAnswers.current,
        postAnswers,
        data: activityData.current,
      }),
    });
    setStage("done");
  };

  const onActivityDone = (data: ResultData) => {
    activityData.current = data;
    if (study!.postQuestions.length > 0) setStage("post");
    else submit([]);
  };

  if (stage === "loading") {
    return <Center><p className="text-ink/40">Loading…</p></Center>;
  }

  if (stage === "unavailable" || !study) {
    return (
      <Center>
        <div className="card p-10 text-center max-w-md">
          <span className="w-12 h-12 rounded-xl bg-ink/5 text-ink/60 grid place-items-center mx-auto mb-4"><IconLock className="w-6 h-6" /></span>
          <h1 className="font-semibold text-lg">This study isn’t available</h1>
          <p className="text-sm text-ink/50 mt-2">
            It may have been closed or hasn’t been launched yet. Please contact
            the person who sent you the link.
          </p>
        </div>
      </Center>
    );
  }

  if (stage === "welcome") {
    return (
      <Center>
        <div className="card p-10 max-w-xl w-full">
          <h1 className="text-xl font-bold text-ink mb-3">{study.name}</h1>
          <p className="text-ink/60 whitespace-pre-wrap mb-6">{study.welcomeMessage}</p>
          <button
            className="btn-primary"
            onClick={() => {
              startMs.current = Date.now();
              startedAt.current = new Date().toISOString();
              setStage(study.preQuestions.length > 0 ? "pre" : "activity");
            }}
          >
            Get started →
          </button>
        </div>
      </Center>
    );
  }

  if (stage === "pre") {
    return (
      <Center>
        <div className="card p-10 max-w-xl w-full">
          <h2 className="font-semibold text-lg text-ink mb-5">
            A few questions before we begin
          </h2>
          <QuestionForm
            questions={study.preQuestions}
            onSubmit={(answers) => {
              preAnswers.current = answers;
              setStage("activity");
            }}
          />
        </div>
      </Center>
    );
  }

  if (stage === "post") {
    return (
      <Center>
        <div className="card p-10 max-w-xl w-full">
          <h2 className="font-semibold text-lg text-ink mb-5">
            Almost done — a few final questions
          </h2>
          <QuestionForm
            questions={study.postQuestions}
            submitLabel="Finish"
            onSubmit={submit}
          />
        </div>
      </Center>
    );
  }

  if (stage === "submitting") {
    return <Center><p className="text-ink/40">Saving your response…</p></Center>;
  }

  if (stage === "done") {
    return (
      <Center>
        <div className="card p-10 text-center max-w-md">
          <span className="w-12 h-12 rounded-full bg-lime text-ink grid place-items-center mx-auto mb-4"><IconCheck className="w-6 h-6" strokeWidth={2.5} /></span>
          <h1 className="font-semibold text-lg">Thank you!</h1>
          <p className="text-sm text-ink/50 mt-2 whitespace-pre-wrap">
            {study.thankYouMessage}
          </p>
        </div>
      </Center>
    );
  }

  // stage === "activity"
  return <Activity study={study} onDone={onActivityDone} />;
}

function Activity({ study, onDone }: { study: Study; onDone: (d: ResultData) => void }) {
  const cfg = study.config;
  switch (cfg.kind) {
    case "card-sort":
      return <CardSortActivity config={cfg} instructions={study.instructions} onDone={onDone} />;
    case "tree-test":
      return <TreeTestActivity config={cfg} instructions={study.instructions} onDone={onDone} />;
    case "first-click":
      return <FirstClickActivity config={cfg} instructions={study.instructions} onDone={onDone} />;
    case "survey":
      return <SurveyActivity config={cfg} onDone={onDone} />;
    case "prototype":
      return <PrototypeActivity config={cfg} instructions={study.instructions} onDone={onDone} />;
    case "usability":
      return <UsabilityActivity config={cfg} instructions={study.instructions} onDone={onDone} />;
    case "cognitive-walkthrough":
      return <CognitiveWalkthroughActivity config={cfg} instructions={study.instructions} onDone={onDone} />;
  }
}

function SurveyActivity({
  config,
  onDone,
}: {
  config: SurveyConfig;
  onDone: (d: ResultData) => void;
}) {
  return (
    <Center>
      <div className="card p-10 max-w-xl w-full">
        <QuestionForm
          questions={config.questions}
          submitLabel="Submit answers"
          onSubmit={(answers) => onDone({ answers })}
        />
      </div>
    </Center>
  );
}
