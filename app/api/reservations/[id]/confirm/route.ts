import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idempotencyKey = req.headers.get("Idempotency-Key");

    if (idempotencyKey) {
      const existing = await prisma.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
      });
      if (existing) {
        return NextResponse.json(existing.response, { status: 200 });
      }
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { stockItem: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }

    if (reservation.status === "CONFIRMED") {
      return NextResponse.json({ error: "Reservation already confirmed." }, { status: 409 });
    }

    if (reservation.status === "RELEASED") {
      return NextResponse.json({ error: "Reservation has been released." }, { status: 410 });
    }

    if (new Date() > reservation.expiresAt) {
      // Lazily release expired reservation
      await prisma.$transaction([
        prisma.reservation.update({ where: { id }, data: { status: "RELEASED" } }),
        prisma.stockItem.update({
          where: { id: reservation.stockItemId },
          data: { reserved: { decrement: reservation.quantity } },
        }),
      ]);
      return NextResponse.json({ error: "Reservation has expired." }, { status: 410 });
    }

    // Confirm: keep reserved units (they're now sold), just flip status
    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: "CONFIRMED" },
      include: {
        stockItem: {
          include: { product: true, warehouse: true },
        },
      },
    });

    const responseBody = {
      id: updated.id,
      quantity: updated.quantity,
      status: updated.status,
      expiresAt: updated.expiresAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    if (idempotencyKey) {
      await prisma.idempotencyRecord.create({
        data: { key: idempotencyKey, reservationId: id, response: responseBody },
      });
    }

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("[POST /api/reservations/:id/confirm]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
