import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { IconArrowRight, IconFlask, TypeTile } from "@/components/icons";
import { currentUser } from "@/lib/auth";
import { countResponses, listStudies } from "@/lib/db";
import { STUDY_TYPE_META } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-ink/5 text-ink/60",
  live: "bg-lime text-ink",
  closed: "bg-amber-100 text-amber-800",
};

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const studies = await listStudies(user.id);
  const counts = await countResponses();
  const totalResponses = studies.reduce((a, s) => a + (counts[s.id] ?? 0), 0);
  const live = studies.filter((s) => s.status === "live").length;

  return (
    <Shell>
      <div className="mb-12">
        <p className="eyebrow mb-3">Research dashboard</p>
        <h1 className="h-display text-4xl sm:text-5xl leading-[1.05] max-w-2xl">
          Understand how people{" "}
          <span className="bg-lime px-1.5 rounded-md">think</span>, not just
          what they say.
        </h1>
        <div className="inline-flex mt-9 card divide-x divide-ink/10 overflow-hidden">
          {[
            [String(studies.length), "studies"],
            [String(live), "live now"],
            [String(totalResponses), "responses"],
          ].map(([v, l]) => (
            <div key={l} className="px-7 py-4">
              <p className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {v}
              </p>
              <p className="eyebrow mt-0.5">{l}</p>
            </div>
          ))}
        </div>
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
        <div className="card divide-y divide-ink/5 overflow-hidden">
          {studies.map((s) => {
            const meta = STUDY_TYPE_META[s.type];
            return (
              <Link
                key={s.id}
                href={`/studies/${s.id}`}
                className="group flex items-center gap-5 px-6 py-5 hover:bg-paper/60 transition-colors"
              >
                <TypeTile type={s.type} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink tracking-tight truncate text-lg">
                    {s.name}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/40 mt-0.5">
                    {meta.label} · updated{" "}
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-mono text-sm text-ink/60 tabular-nums">
                  {counts[s.id] ?? 0}{" "}
                  <span className="text-ink/35">responses</span>
                </span>
                <span
                  className={`font-mono text-[10px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-[0.12em] ${STATUS_STYLES[s.status]}`}
                >
                  {s.status}
                </span>
                <IconArrowRight className="w-4 h-4 text-ink/25 group-hover:text-ink group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
