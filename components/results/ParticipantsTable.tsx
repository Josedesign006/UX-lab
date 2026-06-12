"use client";

import { useRouter } from "next/navigation";
import { fmtMs } from "@/lib/analysis";
import { StudyResponse } from "@/lib/types";

export default function ParticipantsTable({
  studyId,
  responses,
}: {
  studyId: string;
  responses: StudyResponse[];
}) {
  const router = useRouter();

  const remove = async (rid: string) => {
    if (!confirm("Delete this response? This can't be undone.")) return;
    await fetch(`/api/studies/${studyId}/responses/${rid}`, { method: "DELETE" });
    router.refresh();
  };

  if (responses.length === 0) return null;

  return (
    <section className="card p-5">
      <h2 className="font-semibold text-ink mb-3">
        Participants ({responses.length})
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-ink/50 border-b border-ink/10">
            <th className="py-2 pr-4">ID</th>
            <th className="py-2 pr-4">Completed</th>
            <th className="py-2 pr-4">Duration</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {responses.map((r) => (
            <tr key={r.id} className="border-b border-ink/5">
              <td className="py-2 pr-4 font-medium text-ink">{r.participant}</td>
              <td className="py-2 pr-4 text-ink/60">
                {new Date(r.completedAt).toLocaleString()}
              </td>
              <td className="py-2 pr-4 text-ink/60 tabular-nums">
                {fmtMs(r.durationMs)}
              </td>
              <td className="py-2 text-right">
                <button
                  className="text-xs text-red-500 hover:underline"
                  onClick={() => remove(r.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
