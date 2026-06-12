import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { countResponses, createStudy, listStudies } from "@/lib/db";
import { newStudy } from "@/lib/defaults";
import { StudyType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const counts = countResponses();
  const studies = listStudies(user.id).map((s) => ({
    ...s,
    responseCount: counts[s.id] ?? 0,
  }));
  return NextResponse.json(studies);
}

export async function POST(req: NextRequest) {
  const user = currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const type = body.type as StudyType;
  const name = (body.name as string) || "Untitled study";
  const study = newStudy(type, name);
  study.ownerId = user.id;
  createStudy(study);
  return NextResponse.json(study, { status: 201 });
}
