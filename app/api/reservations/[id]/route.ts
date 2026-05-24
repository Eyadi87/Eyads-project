import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        stockItem: {
          include: { product: true, warehouse: true },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }

    // Lazy expiry check
    if (reservation.status === "PENDING" && new Date() > reservation.expiresAt) {
      await prisma.$transaction([
        prisma.reservation.update({ where: { id }, data: { status: "RELEASED" } }),
        prisma.stockItem.update({
          where: { id: reservation.stockItemId },
          data: { reserved: { decrement: reservation.quantity } },
        }),
      ]);
      return NextResponse.json({
        ...formatReservation(reservation),
        status: "RELEASED",
      });
    }

    return NextResponse.json(formatReservation(reservation));
  } catch (err) {
    console.error("[GET /api/reservations/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatReservation(r: {
  id: string;
  quantity: number;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  stockItem: {
    id: string;
    product: { id: string; name: string; description: string; price: { toString(): string }; sku: string; imageUrl: string | null };
    warehouse: { id: string; name: string; location: string };
  };
}) {
  return {
    id: r.id,
    quantity: r.quantity,
    status: r.status,
    expiresAt: r.expiresAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    stockItem: {
      id: r.stockItem.id,
      product: {
        id: r.stockItem.product.id,
        name: r.stockItem.product.name,
        description: r.stockItem.product.description,
        price: r.stockItem.product.price.toString(),
        sku: r.stockItem.product.sku,
        imageUrl: r.stockItem.product.imageUrl,
      },
      warehouse: {
        id: r.stockItem.warehouse.id,
        name: r.stockItem.warehouse.name,
        location: r.stockItem.warehouse.location,
      },
    },
  };
}
