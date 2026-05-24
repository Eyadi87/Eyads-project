"use client";

import { useState } from "react";
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
    if (totalAvailable <= 5) return <span className="tag tag-amber">Only {totalAvailable} left</span>;
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
      className="product-row fade-up border-b border-[#E4E4E7] last:border-b-0"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Main row */}
      <div
        className="grid items-center gap-4 px-6 py-4 cursor-pointer select-none"
        style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr auto" }}
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Name + description */}
        <div className="min-w-0">
          <p className="text-sm text-[#0A0A0A] truncate" style={{ fontWeight: 600 }}>{product.name}</p>
          <p className="text-xs text-[#A1A1AA] mt-0.5 truncate" style={{ fontWeight: 350 }}>{product.description}</p>
        </div>

        {/* SKU */}
        <div className="hidden md:block">
          <span
            className="tag tag-slate text-[10px]"
            style={{ fontFamily: "var(--font-geist-mono)", letterSpacing: "0.04em" }}
          >
            {product.sku}
          </span>
        </div>

        {/* Price */}
        <div>
          <p
            className="text-sm text-[#0A0A0A]"
            style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 600 }}
          >
            &#8377;{Number(product.price).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Stock */}
        <div className="hidden sm:block">
          <p
            className="text-xs text-[#0A0A0A]"
            style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500 }}
          >
            {totalAvailable}
            <span className="text-[#A1A1AA]" style={{ fontWeight: 400 }}> / {totalUnits}</span>
          </p>
          <div className="stock-bar mt-1.5 w-16">
            <div
              className="stock-bar-fill"
              style={{
                width: `${totalUnits > 0 ? (totalAvailable / totalUnits) * 100 : 0}%`,
                background: totalAvailable === 0 ? "#DC2626" : totalAvailable <= 5 ? "#D97706" : "#059669",
              }}
            />
          </div>
        </div>

        {/* Status + toggle */}
        <div className="flex items-center gap-3">
          {statusTag()}
          <span className="text-[#A1A1AA]">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </div>
      </div>

      {/* Expanded warehouse rows */}
      {expanded && (
        <div className="px-6 pb-5 border-t border-[#F4F4F5] bg-[#FAFAFA]">
          <p
            className="text-[10px] uppercase tracking-[0.14em] text-[#A1A1AA] pt-4 pb-3"
            style={{ fontWeight: 600 }}
          >
            Warehouse availability
          </p>
          <div className="divide-y divide-[#F4F4F5]">
            {product.stockItems.map((item) => {
              const pct = item.total > 0 ? (item.available / item.total) * 100 : 0;
              const avail = item.available > 0;
              return (
                <div key={item.id} className="warehouse-slot py-3">
                  {/* Location */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-[#0A0A0A] truncate" style={{ fontWeight: 500 }}>{item.warehouse.name}</p>
                      <p className="text-xs text-[#A1A1AA]" style={{ fontWeight: 350 }}>{item.warehouse.location}</p>
                    </div>
                  </div>

                  {/* Count + bar */}
                  <div className="text-right">
                    <p
                      className="text-xs"
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontWeight: 600,
                        color: avail ? "#059669" : "#DC2626",
                      }}
                    >
                      {item.available} / {item.total}
                    </p>
                    <div className="stock-bar mt-1 ml-auto w-14">
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
                    className="h-8 px-5 text-xs rounded transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 border"
                    style={
                      avail
                        ? { background: "#0A0A0A", color: "#FFFFFF", borderColor: "#0A0A0A", fontWeight: 600 }
                        : { background: "transparent", color: "#A1A1AA", borderColor: "#E4E4E7", fontWeight: 500 }
                    }
                  >
                    {loading === item.warehouse.id ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
                          style={{ borderColor: "rgba(255,255,255,0.25)", borderTopColor: "#fff" }}
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
        </div>
      )}
    </div>
  );
}
