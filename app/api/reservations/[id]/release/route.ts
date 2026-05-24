import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot release a ${reservation.status.toLowerCase()} reservation.` },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.reservation.update({ where: { id }, data: { status: "RELEASED" } }),
      prisma.stockItem.update({
        where: { id: reservation.stockItemId },
        data: { reserved: { decrement: reservation.quantity } },
      }),
    ]);

    return NextResponse.json({ id, status: "RELEASED" });
  } catch (err) {
    console.error("[POST /api/reservations/:id/release]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
