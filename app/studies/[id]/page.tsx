import { notFound, redirect } from "next/navigation";
import { canAccessStudy, currentUser } from "@/lib/auth";
import { getStudy } from "@/lib/db";
import StudyWorkspace from "./StudyWorkspace";

export const dynamic = "force-dynamic";

export default async function StudyPage({
  params,
}: {
  params: { id: string };
}) {
  // Fetch on the server so the editor renders with data already in the HTML —
  // no client "Loading…" spinner or extra round-trip when opening a study.
  const [user, study] = await Promise.all([
    currentUser(),
    getStudy(params.id),
  ]);
  if (!user) redirect("/login");
  if (!study || !canAccessStudy(user, study)) notFound();

  return <StudyWorkspace initialStudy={study} />;
}
