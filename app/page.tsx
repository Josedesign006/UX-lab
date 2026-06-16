import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import {
  IconChart,
  IconClock,
  IconFlask,
  IconPlay,
  IconSparkle,
  IconUsers,
} from "@/components/icons";
import { currentUser } from "@/lib/auth";
import { listStudySummaries, responseStats } from "@/lib/db";
import { fmtMs } from "@/lib/analysis";
import { StudyType } from "@/lib/types";
import StudyBoard, { DashStudy } from "./StudyBoard";

export const dynamic = "force-dynamic";

// Recommended sample sizes per method — drives the per-study progress bars.
const SAMPLE_TARGET: Record<StudyType, number> = {
  "card-sort": 30,
  "tree-test": 50,
  "first-click": 50,
  survey: 50,
  prototype: 20,
  usability: 15,
  "cognitive-walkthrough": 5,
};

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [summaries, stats] = await Promise.all([
    listStudySummaries(user.id),
    responseStats(),
  ]);

  const studies: DashStudy[] = summaries.map((s) => {
    const st = stats[s.id];
    return {
      id: s.id,
      type: s.type,
      name: s.name,
      status: s.status,
      updatedAt: s.updatedAt,
      responses: st?.count ?? 0,
      week: st?.week ?? 0,
      lastAt: st?.lastAt ?? null,
      avgMs: st?.avgMs ?? null,
      target: SAMPLE_TARGET[s.type],
    };
  });

  const live = studies.filter((s) => s.status === "live").length;
  const drafts = studies.filter((s) => s.status === "draft").length;
  const totalResponses = studies.reduce((a, s) => a + s.responses, 0);
  const weekResponses = studies.reduce((a, s) => a + s.week, 0);

  // Weighted mean completion time across every response we have a duration for.
  const durTotal = studies.reduce(
    (a, s) => (s.avgMs != null ? a + s.avgMs * s.responses : a),
    0
  );
  const durCount = studies.reduce(
    (a, s) => (s.avgMs != null ? a + s.responses : a),
    0
  );
  const avgTime = durCount ? fmtMs(Math.round(durTotal / durCount)) : "—";

  const stats6: {
    icon: React.ReactNode;
    value: string;
    label: string;
    sub?: string;
    accent?: boolean;
  }[] = [
    { icon: <IconFlask className="w-4 h-4" />, value: String(studies.length), label: "studies" },
    { icon: <IconPlay className="w-4 h-4" />, value: String(live), label: "live now", accent: live > 0 },
    { icon: <IconSparkle className="w-4 h-4" />, value: String(drafts), label: "drafts", sub: drafts ? "awaiting launch" : undefined },
    { icon: <IconUsers className="w-4 h-4" />, value: String(totalResponses), label: "responses" },
    { icon: <IconChart className="w-4 h-4" />, value: `+${weekResponses}`, label: "this week", accent: weekResponses > 0 },
    { icon: <IconClock className="w-4 h-4" />, value: avgTime, label: "avg. completion" },
  ];

  return (
    <Shell>
      <div className="mb-10">
        <p className="eyebrow mb-3">Research dashboard</p>
        <h1 className="h-display text-4xl sm:text-5xl leading-[1.05] max-w-2xl">
          Understand how people{" "}
          <span className="bg-lime px-1.5 rounded-md">think</span>, not just
          what they say.
        </h1>
      </div>

      {studies.length === 0 ? (
        <div className="card p-16 text-center">
          <span className="w-14 h-14 rounded-2xl bg-ink text-lime grid place-items-center mx-auto mb-5">
            <IconFlask className="w-7 h-7" />
          </span>
          <h2 className="h-display text-2xl">No studies yet</h2>
          <p className="text-sm text-ink/50 mt-2 mb-7 max-w-md mx-auto">
            Start with card sorting, tree testing, first-click testing, a
            survey, prototype testing or usability testing.
          </p>
          <Link href="/studies/new" className="btn-primary">
            Create your first study
          </Link>
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-9">
            {stats6.map((k) => (
              <div key={k.label} className="card px-5 py-4">
                <span
                  className={`w-8 h-8 rounded-lg grid place-items-center mb-3 ${
                    k.accent ? "bg-lime text-ink" : "bg-ink/5 text-ink/60"
                  }`}
                >
                  {k.icon}
                </span>
                <p className="font-mono text-2xl font-semibold text-ink tabular-nums leading-none">
                  {k.value}
                </p>
                <p className="eyebrow mt-1.5">{k.label}</p>
                {k.sub && (
                  <p className="text-[10px] text-ink/35 mt-0.5">{k.sub}</p>
                )}
              </div>
            ))}
          </div>

          <StudyBoard studies={studies} />
        </>
      )}
    </Shell>
  );
}
