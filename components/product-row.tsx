"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import type { ProductWithStock } from "@/lib/types";
import { crypto } from "@/lib/idempotency";

interface Props {
  product: ProductWithStock;
  index: number;
}

export function ProductRow({ product, index }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const totalAvailable = product.stockItems.reduce((s, i) => s + i.available, 0);
  const totalUnits = product.stockItems.reduce((s, i) => s + i.total, 0);

  const statusTag = () => {
    if (totalAvailable === 0) return <span className="tag tag-red">Out of stock</span>;
    if (totalAvailable <= 5) return <span className="tag tag-amber">Low stock</span>;
    return <span className="tag tag-green">In stock</span>;
  };

  async function reserve(warehouseId: string, warehouseName: string) {
    setLoading(warehouseId);
    try {
      const key = crypto.randomKey();
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({ productId: product.id, warehouseId, quantity: 1 }),
      });
      const data = await res.json();
      if (res.status === 409) {
        toast.error("Not enough stock", { description: data.error });
        return;
      }
      if (!res.ok) {
        toast.error("Reservation failed", { description: data.error });
        return;
      }
      toast.success(`Reserved from ${warehouseName}`, {
        description: "Your hold expires in 10 minutes.",
      });
      router.push(`/reservation/${data.id}`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      className="product-row fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Main row */}
      <div
        className="grid items-center gap-4 px-6 py-4 cursor-pointer select-none"
        style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr auto" }}
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Name + SKU */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0A0A0A] truncate">{product.name}</p>
          <p className="text-xs text-[#71717A] mt-0.5 truncate">{product.description}</p>
        </div>

        {/* SKU */}
        <div className="hidden md:block">
          <span className="tag tag-slate num">{product.sku}</span>
        </div>

        {/* Price */}
        <div>
          <p className="text-sm font-semibold text-[#0A0A0A] num">
            &#8377;{Number(product.price).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Stock summary */}
        <div className="hidden sm:block">
          <p className="text-sm num text-[#0A0A0A]">
            {totalAvailable}
            <span className="text-[#71717A] text-xs"> / {totalUnits} avail</span>
          </p>
          <div className="stock-bar mt-1.5 w-20">
            <div
              className="stock-bar-fill"
              style={{
                width: `${totalUnits > 0 ? (totalAvailable / totalUnits) * 100 : 0}%`,
                background: totalAvailable === 0 ? "#DC2626" : totalAvailable <= 5 ? "#D97706" : "#059669",
              }}
            />
          </div>
        </div>

        {/* Status + expand */}
        <div className="flex items-center gap-3">
          {statusTag()}
          <span className="text-[#71717A]">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </div>

      {/* Expanded warehouse rows */}
      {expanded && (
        <div className="px-6 pb-4 bg-[#FAFAFA] border-t border-[#F0F0F0]">
          <p className="text-[11px] font-semibold text-[#71717A] uppercase tracking-widest pt-4 pb-2">
            Warehouse availability
          </p>
          {product.stockItems.map((item) => {
            const pct = item.total > 0 ? (item.available / item.total) * 100 : 0;
            const avail = item.available > 0;
            return (
              <div key={item.id} className="warehouse-slot">
                {/* Location */}
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0A0A0A] truncate">{item.warehouse.name}</p>
                    <p className="text-xs text-[#71717A]">{item.warehouse.location}</p>
                  </div>
                </div>

                {/* Stock count + bar */}
                <div className="text-right min-w-[80px]">
                  <p className={`text-xs font-semibold num ${avail ? "text-[#059669]" : "text-[#DC2626]"}`}>
                    {item.available} of {item.total} units
                  </p>
                  <div className="stock-bar mt-1 ml-auto w-16">
                    <div
                      className="stock-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: pct > 50 ? "#059669" : pct > 15 ? "#D97706" : "#DC2626",
                      }}
                    />
                  </div>
                </div>

                {/* Reserve button */}
                <button
                  disabled={!avail || loading === item.warehouse.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    reserve(item.warehouse.id, item.warehouse.name);
                  }}
                  className="h-8 px-4 text-xs font-semibold rounded border transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  style={
                    avail
                      ? {
                          background: "#0A0A0A",
                          color: "#FFFFFF",
                          borderColor: "#0A0A0A",
                        }
                      : {
                          background: "transparent",
                          color: "#71717A",
                          borderColor: "#E4E4E7",
                        }
                  }
                >
                  {loading === item.warehouse.id ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
                        style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                      />
                      Holding...
                    </span>
                  ) : avail ? (
                    "Reserve"
                  ) : (
                    "Unavailable"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
