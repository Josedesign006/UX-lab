import { NextRequest, NextResponse } from "next/server";
import { canAccessStudy, currentUser } from "@/lib/auth";
import { deleteStudy, getStudy, updateStudy } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const study = getStudy(params.id);
  if (!study) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const user = currentUser();
  // owners get full access; anonymous participants may read LIVE studies only
  if (!canAccessStudy(user, study) && study.status !== "live") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(study);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const study = getStudy(params.id);
  if (!study) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessStudy(currentUser(), study)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const patch = await req.json();
  delete patch.id;
  delete patch.createdAt;
  delete patch.ownerId; // ownership can't be changed via API
  const updated = updateStudy(params.id, patch);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const study = getStudy(params.id);
  if (!study) return NextResponse.json({ ok: true });
  if (!canAccessStudy(currentUser(), study)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  deleteStudy(params.id);
  return NextResponse.json({ ok: true });
}
