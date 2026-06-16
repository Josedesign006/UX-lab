import { NextRequest, NextResponse } from "next/server";
import { canAccessStudy, currentUser } from "@/lib/auth";
import { getStudy, listResponses } from "@/lib/db";
import { nodePathLabel } from "@/lib/analysis";
import {
  CardSortConfig,
  CardSortResult,
  CognitiveWalkthroughConfig,
  CognitiveWalkthroughResult,
  CWDimension,
  FirstClickConfig,
  FirstClickResult,
  PrototypeConfig,
  PrototypeResult,
  Question,
  Study,
  StudyResponse,
  SurveyConfig,
  SurveyResult,
  TreeTestConfig,
  TreeTestResult,
  UsabilityConfig,
  UsabilityResult,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function esc(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

function answerCols(questions: Question[], answers: { questionId: string; value: unknown }[]) {
  return questions.map((q) => {
    const a = answers.find((x) => x.questionId === q.id);
    if (!a) return "";
    return Array.isArray(a.value) ? a.value.join("; ") : String(a.value);
  });
}

function buildRows(study: Study, responses: StudyResponse[]): unknown[][] {
  const baseHeader = ["participant", "started_at", "completed_at", "duration_ms"];
  const preH = study.preQuestions.map((q) => `pre: ${q.text}`);
  const postH = study.postQuestions.map((q) => `post: ${q.text}`);
  const base = (r: StudyResponse) => [
    r.participant,
    r.startedAt,
    r.completedAt,
    r.durationMs,
    ...answerCols(study.preQuestions, r.preAnswers),
  ];
  const post = (r: StudyResponse) => answerCols(study.postQuestions, r.postAnswers);

  switch (study.type) {
    case "card-sort": {
      const cfg = study.config as CardSortConfig;
      const cardLabel = new Map(cfg.cards.map((c) => [c.id, c.label]));
      const rows: unknown[][] = [
        [...baseHeader, ...preH, "group_name", "card", ...postH],
      ];
      for (const r of responses) {
        const d = r.data as CardSortResult;
        for (const g of d.groups) {
          for (const cid of g.cardIds) {
            rows.push([...base(r), g.name, cardLabel.get(cid) ?? cid, ...post(r)]);
          }
        }
        for (const cid of d.unsortedCardIds ?? []) {
          rows.push([...base(r), "(unsorted)", cardLabel.get(cid) ?? cid, ...post(r)]);
        }
      }
      return rows;
    }
    case "tree-test": {
      const cfg = study.config as TreeTestConfig;
      const taskText = new Map(cfg.tasks.map((t) => [t.id, t.text]));
      const rows: unknown[][] = [
        [...baseHeader, ...preH, "task", "outcome", "answer_path", "clicks", "time_ms", ...postH],
      ];
      for (const r of responses) {
        const d = r.data as TreeTestResult;
        for (const t of d.tasks) {
          rows.push([
            ...base(r),
            taskText.get(t.taskId) ?? t.taskId,
            t.outcome,
            t.answerNodeId ? nodePathLabel(cfg.tree, t.answerNodeId) : "",
            t.path.length,
            t.timeMs,
            ...post(r),
          ]);
        }
      }
      return rows;
    }
    case "first-click": {
      const cfg = study.config as FirstClickConfig;
      const taskText = new Map(cfg.tasks.map((t) => [t.id, t.instruction]));
      const rows: unknown[][] = [
        [...baseHeader, ...preH, "task", "x", "y", "time_ms", ...postH],
      ];
      for (const r of responses) {
        const d = r.data as FirstClickResult;
        for (const t of d.tasks) {
          rows.push([
            ...base(r),
            taskText.get(t.taskId) ?? t.taskId,
            t.x.toFixed(4),
            t.y.toFixed(4),
            t.timeMs,
            ...post(r),
          ]);
        }
      }
      return rows;
    }
    case "survey": {
      const cfg = study.config as SurveyConfig;
      const rows: unknown[][] = [
        [...baseHeader, ...preH, ...cfg.questions.map((q) => q.text), ...postH],
      ];
      for (const r of responses) {
        const d = r.data as SurveyResult;
        rows.push([...base(r), ...answerCols(cfg.questions, d.answers), ...post(r)]);
      }
      return rows;
    }
    case "prototype": {
      const cfg = study.config as PrototypeConfig;
      const taskText = new Map(cfg.tasks.map((t) => [t.id, t.text]));
      const screenName = new Map(cfg.screens.map((s) => [s.id, s.name]));
      const rows: unknown[][] = [
        [...baseHeader, ...preH, "task", "outcome", "clicks", "misclicks", "screen_path", "time_ms", ...postH],
      ];
      for (const r of responses) {
        const d = r.data as PrototypeResult;
        for (const t of d.tasks) {
          rows.push([
            ...base(r),
            taskText.get(t.taskId) ?? t.taskId,
            t.outcome,
            t.clicks.length,
            t.clicks.filter((c) => !c.hitHotspot).length,
            t.screenPath.map((s) => screenName.get(s) ?? s).join(" > "),
            t.timeMs,
            ...post(r),
          ]);
        }
      }
      return rows;
    }
    case "usability": {
      const cfg = study.config as UsabilityConfig;
      const taskText = new Map(cfg.tasks.map((t) => [t.id, t.text]));
      const rows: unknown[][] = [
        [...baseHeader, ...preH, "task", "completion", "difficulty_1to7", "comment", "time_ms", ...postH],
      ];
      for (const r of responses) {
        const d = r.data as UsabilityResult;
        for (const t of d.tasks) {
          rows.push([
            ...base(r),
            taskText.get(t.taskId) ?? t.taskId,
            t.completion,
            t.difficulty ?? "",
            t.comment,
            t.timeMs,
            ...post(r),
          ]);
        }
      }
      return rows;
    }
    case "cognitive-walkthrough": {
      const cfg = study.config as CognitiveWalkthroughConfig;
      const taskText = new Map(cfg.tasks.map((t) => [t.id, t.text]));
      const stepAction = new Map(
        cfg.tasks.flatMap((t) => t.steps.map((s) => [s.id, s.action]))
      );
      const dimOf = new Map<string, CWDimension>(
        cfg.questions.map((q) => [q.id, q.dimension])
      );
      // one column per question, plus severity / failure story
      const qHeaders = cfg.questions.map(
        (q) => `${dimOf.get(q.id)}: ${q.text}`
      );
      const rows: unknown[][] = [
        [
          ...baseHeader,
          ...preH,
          "task",
          "step",
          ...qHeaders,
          "severity_0to4",
          "failure_story",
          "time_ms",
          ...postH,
        ],
      ];
      for (const r of responses) {
        const d = r.data as CognitiveWalkthroughResult;
        for (const t of d.tasks) {
          for (const s of t.steps) {
            const verdicts = cfg.questions.map(
              (q) =>
                s.answers.find((a) => a.questionId === q.id)?.verdict ?? ""
            );
            rows.push([
              ...base(r),
              taskText.get(t.taskId) ?? t.taskId,
              stepAction.get(s.stepId) ?? s.stepId,
              ...verdicts,
              s.severity ?? "",
              s.failureStory,
              s.timeMs,
              ...post(r),
            ]);
          }
        }
      }
      return rows;
    }
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const study = await getStudy(params.id);
  if (!study) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessStudy(await currentUser(), study)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const responses = await listResponses(params.id);
  const csv = toCsv(buildRows(study, responses));
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${study.name.replace(/[^a-z0-9-_ ]/gi, "")}-raw-data.csv"`,
    },
  });
}
