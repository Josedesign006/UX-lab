import QuestionSummaries from "@/components/results/QuestionSummaries";
import { Stat } from "@/components/charts/Bars";
import { fmtMs, median } from "@/lib/analysis";
import { StudyResponse, SurveyConfig, SurveyResult } from "@/lib/types";

export default function SurveyResults({
  config,
  responses,
}: {
  config: SurveyConfig;
  responses: StudyResponse[];
}) {
  if (responses.length === 0) {
    return (
      <p className="text-ink/50 text-sm">
        No responses yet — share the participant link to start collecting data.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 gap-3 max-w-md">
        <Stat label="Responses" value={String(responses.length)} />
        <Stat
          label="Median completion time"
          value={fmtMs(median(responses.map((r) => r.durationMs)))}
        />
      </div>
      <QuestionSummaries
        questions={config.questions}
        answerSets={responses.map((r) => (r.data as SurveyResult).answers)}
      />
    </div>
  );
}
