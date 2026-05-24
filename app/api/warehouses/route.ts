import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(warehouses);
  } catch (err) {
    console.error("[GET /api/warehouses]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
