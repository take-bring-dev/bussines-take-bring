import { NextResponse } from "next/server";
import { syncEscrowFromStripe } from "@/lib/escrow";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles("SHIPPER", "SUPER_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id: loadId } = await context.params;
  const load = await prisma.load.findUnique({
    where: { id: loadId },
    select: { shipperId: true },
  });

  if (!load || (load.shipperId !== auth.user.id && auth.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Load not found." }, { status: 404 });
  }

  const escrow = await syncEscrowFromStripe(loadId);
  return NextResponse.json({
    ok: true,
    status: escrow?.status ?? null,
  });
}
