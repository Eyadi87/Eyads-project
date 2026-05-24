import { prisma } from "@/lib/db";
import { CreateReservationSchema } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TTL_MINUTES = Number(process.env.RESERVATION_TTL_MINUTES ?? 10);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { productId, warehouseId, quantity } = parsed.data;
    const idempotencyKey = req.headers.get("Idempotency-Key");

    // Idempotency check
    if (idempotencyKey) {
      const existing = await prisma.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
      });
      if (existing) {
        return NextResponse.json(existing.response, { status: 200 });
      }
    }

    // Atomic reservation using a raw SQL UPDATE with WHERE clause to prevent race conditions.
    // We increment reserved only if (total - reserved) >= quantity.
    // This single atomic UPDATE is the concurrency guarantee — no separate SELECT needed.
    const result = await prisma.$queryRaw<{ id: string }[]>`
      UPDATE "StockItem"
      SET reserved = reserved + ${quantity}
      WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
        AND (total - reserved) >= ${quantity}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Not enough stock available for this product at the selected warehouse." },
        { status: 409 }
      );
    }

    const stockItemId = result[0].id;
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

    const reservation = await prisma.reservation.create({
      data: { stockItemId, quantity, expiresAt },
      include: {
        stockItem: {
          include: {
            product: true,
            warehouse: true,
          },
        },
      },
    });

    const responseBody = {
      id: reservation.id,
      quantity: reservation.quantity,
      status: reservation.status,
      expiresAt: reservation.expiresAt.toISOString(),
      createdAt: reservation.createdAt.toISOString(),
      stockItem: {
        id: reservation.stockItem.id,
        product: {
          id: reservation.stockItem.product.id,
          name: reservation.stockItem.product.name,
          description: reservation.stockItem.product.description,
          price: reservation.stockItem.product.price.toString(),
          sku: reservation.stockItem.product.sku,
          imageUrl: reservation.stockItem.product.imageUrl,
        },
        warehouse: {
          id: reservation.stockItem.warehouse.id,
          name: reservation.stockItem.warehouse.name,
          location: reservation.stockItem.warehouse.location,
        },
      },
    };

    // Store idempotency record
    if (idempotencyKey) {
      await prisma.idempotencyRecord.create({
        data: {
          key: idempotencyKey,
          reservationId: reservation.id,
          response: responseBody,
        },
      });
    }

    return NextResponse.json(responseBody, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reservations]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
