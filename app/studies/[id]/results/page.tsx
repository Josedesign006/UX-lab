import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canAccessStudy, currentUser } from "@/lib/auth";
import Shell from "@/components/Shell";
import { IconArrowLeft, IconDownload, TypeTile } from "@/components/icons";
import CardSortResults from "@/components/results/CardSortResults";
import TreeTestResults from "@/components/results/TreeTestResults";
import FirstClickResults from "@/components/results/FirstClickResults";
import SurveyResults from "@/components/results/SurveyResults";
import PrototypeResults from "@/components/results/PrototypeResults";
import UsabilityResults from "@/components/results/UsabilityResults";
import CognitiveWalkthroughResults from "@/components/results/CognitiveWalkthroughResults";
import QuestionSummaries from "@/components/results/QuestionSummaries";
import ParticipantsTable from "@/components/results/ParticipantsTable";
import { getStudy, listResponses } from "@/lib/db";
import {
  CardSortConfig,
  CognitiveWalkthroughConfig,
  FirstClickConfig,
  PrototypeConfig,
  STUDY_TYPE_META,
  Study,
  StudyResponse,
  SurveyConfig,
  TreeTestConfig,
  UsabilityConfig,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: { id: string } }) {
  const [user, study, responses] = await Promise.all([
    currentUser(),
    getStudy(params.id),
    listResponses(params.id),
  ]);
  if (!user) redirect("/login");
  if (!study || !canAccessStudy(user, study)) notFound();
  const meta = STUDY_TYPE_META[study.type];

  return (
    <Shell>
      <div className="flex flex-wrap items-center gap-4 mb-10">
        <TypeTile type={study.type} size="lg" />
        <div className="flex-1 min-w-60">
          <p className="eyebrow mb-1">{meta.label} · Results</p>
          <h1 className="h-display text-3xl">{study.name}</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45 mt-1.5">
            {responses.length} response{responses.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href={`/studies/${study.id}`} className="btn-secondary">
          <IconArrowLeft className="w-4 h-4" /> Back to study
        </Link>
        <a href={`/api/studies/${study.id}/export`} className="btn-primary" download>
          <IconDownload className="w-4 h-4 text-lime" /> Export CSV
        </a>
      </div>

      <TypedResults study={study} responses={responses} />

      {(study.preQuestions.length > 0 || study.postQuestions.length > 0) &&
        responses.length > 0 && (
          <div className="mt-10 space-y-8">
            {study.preQuestions.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg text-ink mb-3">
                  Pre-study questions
                </h2>
                <QuestionSummaries
                  questions={study.preQuestions}
                  answerSets={responses.map((r) => r.preAnswers)}
                />
              </div>
            )}
            {study.postQuestions.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg text-ink mb-3">
                  Post-study questions
                </h2>
                <QuestionSummaries
                  questions={study.postQuestions}
                  answerSets={responses.map((r) => r.postAnswers)}
                />
              </div>
            )}
          </div>
        )}

      <div className="mt-10">
        <ParticipantsTable studyId={study.id} responses={responses} />
      </div>
    </Shell>
  );
}

function TypedResults({
  study,
  responses,
}: {
  study: Study;
  responses: StudyResponse[];
}) {
  switch (study.type) {
    case "card-sort":
      return (
        <CardSortResults
          config={study.config as CardSortConfig}
          responses={responses}
        />
      );
    case "tree-test":
      return (
        <TreeTestResults
          config={study.config as TreeTestConfig}
          responses={responses}
        />
      );
    case "first-click":
      return (
        <FirstClickResults
          config={study.config as FirstClickConfig}
          responses={responses}
        />
      );
    case "survey":
      return (
        <SurveyResults config={study.config as SurveyConfig} responses={responses} />
      );
    case "prototype":
      return (
        <PrototypeResults
          config={study.config as PrototypeConfig}
          responses={responses}
        />
      );
    case "usability":
      return (
        <UsabilityResults
          config={study.config as UsabilityConfig}
          responses={responses}
        />
      );
    case "cognitive-walkthrough":
      return (
        <CognitiveWalkthroughResults
          config={study.config as CognitiveWalkthroughConfig}
          responses={responses}
        />
      );
  }
}
