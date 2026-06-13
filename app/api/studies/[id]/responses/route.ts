import { NextRequest, NextResponse } from "next/server";
import { canAccessStudy, currentUser } from "@/lib/auth";
import { addResponse, getStudy, listResponses, uid } from "@/lib/db";
import { StudyResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const study = await getStudy(params.id);
  if (!study || !canAccessStudy(await currentUser(), study)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await listResponses(params.id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const study = await getStudy(params.id);
  if (!study) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (study.status !== "live")
    return NextResponse.json({ error: "Study is not accepting responses" }, { status: 403 });

  const body = await req.json();
  const resp: StudyResponse = {
    id: uid("r"),
    studyId: params.id,
    participant: "",
    startedAt: body.startedAt ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: body.durationMs ?? 0,
    preAnswers: body.preAnswers ?? [],
    postAnswers: body.postAnswers ?? [],
    data: body.data,
  };
  await addResponse(resp);
  return NextResponse.json({ ok: true }, { status: 201 });
}
