"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Package, CheckCircle2, XCircle, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/countdown-timer";
import type { ReservationWithDetails } from "@/lib/types";

interface Props {
  reservation: ReservationWithDetails;
}

type Status = "PENDING" | "CONFIRMED" | "RELEASED";

export function ReservationClient({ reservation: initial }: Props) {
  const router = useRouter();
  const [reservation, setReservation] = useState(initial);
  const [status, setStatus] = useState<Status>(initial.status as Status);
  const [loading, setLoading] = useState<"confirm" | "cancel" | null>(null);

  const handleExpired = useCallback(() => {
    setStatus("RELEASED");
    toast.error("Reservation expired", {
      description: "Your hold has expired. The units are now available again.",
    });
  }, []);

  async function confirm() {
    setLoading("confirm");
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/confirm`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.status === 410) {
        setStatus("RELEASED");
        toast.error("Reservation expired", { description: data.error });
        return;
      }
      if (!res.ok) {
        toast.error("Confirmation failed", { description: data.error });
        return;
      }

      setStatus("CONFIRMED");
      toast.success("Purchase confirmed!", {
        description: `Order placed for ${reservation.quantity}x ${reservation.stockItem.product.name}`,
      });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function cancel() {
    setLoading("cancel");
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/release`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Cancel failed", { description: data.error });
        return;
      }

      setStatus("RELEASED");
      toast.info("Reservation cancelled", {
        description: "Units returned to available stock.",
      });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  const product = reservation.stockItem.product;
  const warehouse = reservation.stockItem.warehouse;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E6E8EA] bg-white/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="h-8 px-2 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <span className="text-sm font-medium text-[#0F172A]">Checkout</span>
          <div className="ml-auto">
            <StatusBadge status={status} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
        {/* Countdown — only show if pending */}
        {status === "PENDING" && (
          <CountdownTimer expiresAt={reservation.expiresAt} onExpired={handleExpired} />
        )}

        {/* Confirmed banner */}
        {status === "CONFIRMED" && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 animate-in-up">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Purchase confirmed!</p>
              <p className="text-xs text-emerald-600">Your order has been placed successfully.</p>
            </div>
          </div>
        )}

        {/* Released/expired banner */}
        {status === "RELEASED" && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-in-up">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Reservation released</p>
              <p className="text-xs text-red-500">Units returned to available stock.</p>
            </div>
          </div>
        )}

        {/* Product card */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div>
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold tracking-wider uppercase bg-slate-100 text-slate-500 border-0 mb-2"
            >
              {product.sku}
            </Badge>
            <h2 className="text-xl font-bold text-[#0F172A]">{product.name}</h2>
            <p className="text-sm text-[#64748B] mt-1 leading-relaxed">{product.description}</p>
          </div>

          <div className="border-t border-[#E6E8EA] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Unit price</span>
              <span className="text-sm font-semibold text-[#0F172A] tabular-nums">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Quantity</span>
              <span className="text-sm font-semibold text-[#0F172A] tabular-nums">{reservation.quantity}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#E6E8EA] pt-3">
              <span className="text-sm font-semibold text-[#0F172A]">Total</span>
              <span className="text-lg font-bold text-[#0F172A] tabular-nums">
                ₹{(Number(product.price) * reservation.quantity).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Warehouse */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-[#334155]">Fulfillment from</p>
              <p className="text-xs text-[#64748B]">{warehouse.name} · {warehouse.location}</p>
            </div>
          </div>

          {/* Reservation ID */}
          <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
            <Package className="w-3 h-3" />
            <span>Reservation ID: <span className="font-mono">{reservation.id}</span></span>
          </div>
        </div>

        {/* Actions */}
        {status === "PENDING" && (
          <div className="flex flex-col sm:flex-row gap-3 animate-in-up">
            <Button
              onClick={confirm}
              disabled={loading !== null}
              className="flex-1 h-12 bg-[#334155] hover:bg-[#059669] text-white font-semibold text-sm rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading === "confirm" ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Confirm purchase
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={cancel}
              disabled={loading !== null}
              className="flex-1 sm:flex-none sm:w-auto h-12 border-[#E6E8EA] text-[#64748B] hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-medium text-sm rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "cancel" ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  Cancelling...
                </span>
              ) : (
                "Cancel"
              )}
            </Button>
          </div>
        )}

        {(status === "CONFIRMED" || status === "RELEASED") && (
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full h-12 border-[#E6E8EA] text-[#334155] font-medium rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to catalog
          </Button>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; class: string }> = {
    PENDING: { label: "Pending", class: "bg-amber-50 text-amber-700 border-amber-200" },
    CONFIRMED: { label: "Confirmed", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    RELEASED: { label: "Released", class: "bg-red-50 text-red-600 border-red-200" },
  };
  const { label, class: cls } = map[status];
  return (
    <span className={`text-[11px] font-semibold border rounded-full px-2.5 py-0.5 ${cls}`}>
      {label}
    </span>
  );
}
