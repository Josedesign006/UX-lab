import { NextRequest, NextResponse } from "next/server";
import { canAccessStudy, currentUser } from "@/lib/auth";
import { deleteResponse, getStudy } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; rid: string } }
) {
  const study = await getStudy(params.id);
  if (!study || !canAccessStudy(await currentUser(), study)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await deleteResponse(params.id, params.rid);
  return NextResponse.json({ ok: true });
}
