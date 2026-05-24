import { z } from "zod";

export const CreateReservationSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const ConfirmReservationSchema = z.object({
  id: z.string().min(1),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

export type ReservationStatus = "PENDING" | "CONFIRMED" | "RELEASED";

export interface ProductWithStock {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  price: string;
  sku: string;
  stockItems: {
    id: string;
    total: number;
    reserved: number;
    available: number;
    warehouse: {
      id: string;
      name: string;
      location: string;
    };
  }[];
}

export interface ReservationWithDetails {
  id: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
  stockItem: {
    id: string;
    product: {
      id: string;
      name: string;
      description: string;
      price: string;
      sku: string;
      imageUrl: string | null;
    };
    warehouse: {
      id: string;
      name: string;
      location: string;
    };
  };
}
