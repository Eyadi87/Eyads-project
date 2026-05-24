import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        stockItems: {
          include: { warehouse: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const result = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      price: p.price.toString(),
      sku: p.sku,
      stockItems: p.stockItems.map((s) => ({
        id: s.id,
        total: s.total,
        reserved: s.reserved,
        available: Math.max(0, s.total - s.reserved),
        warehouse: {
          id: s.warehouse.id,
          name: s.warehouse.name,
          location: s.warehouse.location,
        },
      })),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
