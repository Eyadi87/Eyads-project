"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, ArrowLeft, CheckCircle2, XCircle, Package } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { crypto } from "@/lib/idempotency";
import type { ReservationWithDetails } from "@/lib/types";

interface Props {
  reservation: ReservationWithDetails;
}

type Status = "PENDING" | "CONFIRMED" | "RELEASED";

export function ReservationClient({ reservation: initial }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initial.status as Status);
  const [loading, setLoading] = useState<"confirm" | "cancel" | null>(null);

  const handleExpired = useCallback(() => {
    setStatus("RELEASED");
    toast.error("Reservation expired", {
      description: "Your hold has expired. Units returned to available stock.",
    });
  }, []);

  async function confirm() {
    setLoading("confirm");
    try {
      const key = crypto.randomKey();
      const res = await fetch(`/api/reservations/${initial.id}/confirm`, {
        method: "POST",
        headers: { "Idempotency-Key": key },
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
      toast.success("Purchase confirmed", {
        description: `Order placed: ${initial.quantity}x ${initial.stockItem.product.name}`,
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
      const res = await fetch(`/api/reservations/${initial.id}/release`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Cancel failed", { description: data.error });
        return;
      }
      setStatus("RELEASED");
      toast.info("Reservation cancelled", { description: "Stock returned to available inventory." });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  const product = initial.stockItem.product;
  const warehouse = initial.stockItem.warehouse;

  const statusColors: Record<Status, { bg: string; border: string; text: string; label: string }> = {
    PENDING:   { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706", label: "Pending" },
    CONFIRMED: { bg: "#ECFDF5", border: "#A7F3D0", text: "#059669", label: "Confirmed" },
    RELEASED:  { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626", label: "Released" },
  };
  const sc = statusColors[status];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-[#E4E4E7] bg-[#FAFAFA]/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 h-12 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-xs text-[#71717A] hover:text-[#0A0A0A] transition-colors duration-150 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to catalog
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#71717A]">Checkout</span>
            <span
              className="tag num"
              style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
            >
              {sc.label}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-6">

        {/* Status banners */}
        {status === "CONFIRMED" && (
          <div
            className="border rounded-lg px-5 py-4 flex items-center gap-3 fade-up"
            style={{ background: "#ECFDF5", borderColor: "#A7F3D0" }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#059669" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#065F46" }}>Purchase confirmed</p>
              <p className="text-xs mt-0.5" style={{ color: "#059669" }}>Your order has been placed successfully.</p>
            </div>
          </div>
        )}

        {status === "RELEASED" && (
          <div
            className="border rounded-lg px-5 py-4 flex items-center gap-3 fade-up"
            style={{ background: "#FEF2F2", borderColor: "#FECACA" }}
          >
            <XCircle className="w-5 h-5 shrink-0" style={{ color: "#DC2626" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#7F1D1D" }}>Reservation released</p>
              <p className="text-xs mt-0.5" style={{ color: "#DC2626" }}>Units have been returned to available stock.</p>
            </div>
          </div>
        )}

        {/* Countdown */}
        {status === "PENDING" && (
          <CountdownTimer expiresAt={initial.expiresAt} onExpired={handleExpired} />
        )}

        {/* Order summary */}
        <div className="border border-[#E4E4E7] rounded-lg bg-white overflow-hidden fade-up">
          <div className="px-5 py-4 border-b border-[#E4E4E7]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#71717A]">
              Order summary
            </p>
          </div>

          {/* Product */}
          <div className="px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <span className="tag tag-slate num mb-2 inline-flex">{product.sku}</span>
                <h2 className="text-base font-bold text-[#0A0A0A] mt-1">{product.name}</h2>
                <p className="text-sm text-[#71717A] mt-0.5 leading-relaxed">{product.description}</p>
              </div>
              <p className="text-xl font-bold text-[#0A0A0A] num shrink-0">
                &#8377;{Number(product.price).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Line items */}
          <div className="border-t border-[#E4E4E7]">
            {[
              { label: "Unit price", value: `₹${Number(product.price).toLocaleString("en-IN")}` },
              { label: "Quantity", value: `${initial.quantity}` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between px-5 py-3 border-b border-[#F4F4F5]"
              >
                <span className="text-sm text-[#71717A]">{label}</span>
                <span className="text-sm font-medium text-[#0A0A0A] num">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-semibold text-[#0A0A0A]">Total</span>
              <span className="text-lg font-bold text-[#0A0A0A] num">
                &#8377;{(Number(product.price) * initial.quantity).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Warehouse */}
          <div className="border-t border-[#E4E4E7] px-5 py-3 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
            <span className="text-xs text-[#71717A]">
              Fulfillment from <span className="font-medium text-[#0A0A0A]">{warehouse.name}</span>{" "}
              in {warehouse.location}
            </span>
          </div>

          {/* Reservation ID */}
          <div className="border-t border-[#E4E4E7] px-5 py-3 flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
            <span className="text-xs text-[#71717A]">
              Reservation{" "}
              <span className="font-mono text-[#0A0A0A]">{initial.id}</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        {status === "PENDING" && (
          <div className="flex flex-col sm:flex-row gap-3 fade-up">
            <button
              onClick={confirm}
              disabled={loading !== null}
              className="flex-1 h-11 px-6 text-sm font-semibold rounded border transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#0A0A0A", color: "#FFFFFF", borderColor: "#0A0A0A" }}
            >
              {loading === "confirm" ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin"
                    style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                  />
                  Processing...
                </span>
              ) : (
                "Confirm purchase"
              )}
            </button>
            <button
              onClick={cancel}
              disabled={loading !== null}
              className="h-11 px-6 text-sm font-medium rounded border transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "transparent",
                color: "#71717A",
                borderColor: "#E4E4E7",
              }}
            >
              {loading === "cancel" ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin"
                    style={{ borderColor: "rgba(0,0,0,0.15)", borderTopColor: "#71717A" }}
                  />
                  Cancelling...
                </span>
              ) : (
                "Cancel"
              )}
            </button>
          </div>
        )}

        {(status === "CONFIRMED" || status === "RELEASED") && (
          <button
            onClick={() => router.push("/")}
            className="w-full h-11 px-6 text-sm font-medium rounded border transition-all duration-150 cursor-pointer"
            style={{ background: "transparent", color: "#71717A", borderColor: "#E4E4E7" }}
          >
            <span className="flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to catalog
            </span>
          </button>
        )}

        {/* Instructions */}
        <div className="border border-[#E4E4E7] rounded-lg bg-white px-5 py-5 space-y-3 text-xs text-[#71717A] leading-relaxed">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#71717A] mb-3">
            What happens next
          </p>
          <p>
            <span className="font-semibold text-[#0A0A0A]">Confirm purchase:</span>{" "}
            Clicking Confirm purchase finalizes the order. Stock is permanently decremented and the reservation status changes to Confirmed.
          </p>
          <p>
            <span className="font-semibold text-[#0A0A0A]">Cancel:</span>{" "}
            Clicking Cancel releases your hold immediately. Units return to available stock for other buyers.
          </p>
          <p>
            <span className="font-semibold text-[#0A0A0A]">Timer expires:</span>{" "}
            If the countdown reaches zero without confirmation, the hold is automatically released and you will see a 410 Expired status. You can return to the catalog to reserve again.
          </p>
        </div>
      </main>
    </div>
  );
}
