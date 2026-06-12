"use client";

import QuestionEditor from "@/components/QuestionEditor";
import { SurveyConfig } from "@/lib/types";

export default function SurveyBuilder({
  config,
  onChange,
}: {
  config: SurveyConfig;
  onChange: (c: SurveyConfig) => void;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm text-ink/50 mb-4">
        Build your survey. Supports text, choice, Likert, rating, ranking and
        numeric questions.
      </p>
      <QuestionEditor
        questions={config.questions}
        onChange={(questions) => onChange({ ...config, questions })}
        emptyHint="No questions yet — add your first question below."
      />
    </div>
  );
}
