"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Package, Zap, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProductWithStock } from "@/lib/types";

interface Props {
  product: ProductWithStock;
}

export function ProductCard({ product }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const totalAvailable = product.stockItems.reduce((sum, s) => sum + s.available, 0);

  async function reserve(stockItemId: string, warehouseId: string, warehouseName: string) {
    setLoading(stockItemId);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          warehouseId,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error("Out of stock", { description: data.error });
        return;
      }
      if (!res.ok) {
        toast.error("Reservation failed", { description: data.error });
        return;
      }

      toast.success("Reserved!", { description: `Held from ${warehouseName} for 10 minutes.` });
      router.push(`/reservation/${data.id}`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-0.5 animate-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold tracking-wider uppercase bg-slate-100 text-slate-500 border-0"
            >
              {product.sku}
            </Badge>
            {totalAvailable === 0 ? (
              <Badge className="text-[10px] bg-red-50 text-red-600 border-red-100 font-medium">
                Out of stock
              </Badge>
            ) : totalAvailable <= 5 ? (
              <Badge className="text-[10px] bg-amber-50 text-amber-600 border-amber-100 font-medium">
                Only {totalAvailable} left
              </Badge>
            ) : (
              <Badge className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100 font-medium">
                In stock
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-[#0F172A] text-base leading-snug">{product.name}</h3>
          <p className="text-sm text-[#64748B] mt-0.5 leading-relaxed line-clamp-2">{product.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-[#0F172A] tabular-nums">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Warehouse stock grid */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1">
          <Package className="w-3 h-3" /> Warehouse stock
        </p>
        <div className="space-y-1.5">
          {product.stockItems.map((item) => {
            const pct = item.total > 0 ? (item.available / item.total) * 100 : 0;
            const isAvailable = item.available > 0;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#334155] truncate">{item.warehouse.name}</p>
                    <p className="text-[11px] text-[#94A3B8] truncate">{item.warehouse.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className={`text-xs font-semibold tabular-nums ${isAvailable ? "text-emerald-600" : "text-slate-400"}`}>
                      {item.available} / {item.total}
                    </p>
                    <div className="w-16 h-1 bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-400" : "bg-red-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!isAvailable || loading === item.id}
                    onClick={() => reserve(item.id, item.warehouse.id, item.warehouse.name)}
                    className="h-7 px-3 text-xs font-medium bg-[#334155] hover:bg-[#059669] text-white transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 rounded-lg"
                  >
                    {loading === item.id ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Holding...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Reserve
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalAvailable === 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          All warehouses currently out of stock for this product.
        </div>
      )}
    </div>
  );
}
