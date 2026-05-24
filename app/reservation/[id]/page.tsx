import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReservationClient } from "./reservation-client";
import type { ReservationWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReservationPage({ params }: Props) {
  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      stockItem: {
        include: { product: true, warehouse: true },
      },
    },
  });

  if (!reservation) notFound();

  // Lazy expiry
  if (reservation.status === "PENDING" && new Date() > reservation.expiresAt) {
    await prisma.$transaction([
      prisma.reservation.update({ where: { id }, data: { status: "RELEASED" } }),
      prisma.stockItem.update({
        where: { id: reservation.stockItem.id },
        data: { reserved: { decrement: reservation.quantity } },
      }),
    ]);
    reservation.status = "RELEASED" as typeof reservation.status;
  }

  const data: ReservationWithDetails = {
    id: reservation.id,
    quantity: reservation.quantity,
    status: reservation.status as "PENDING" | "CONFIRMED" | "RELEASED",
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

  return <ReservationClient reservation={data} />;
}
