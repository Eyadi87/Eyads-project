import { prisma } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { Package, Clock, CheckCircle2, XCircle, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

async function getOrders() {
  const reservations = await prisma.reservation.findMany({
    include: {
      stockItem: {
        include: { product: true, warehouse: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return reservations;
}

function StatusBadge({ status, expiresAt }: { status: string; expiresAt: Date }) {
  const expired = status === "PENDING" && new Date() > expiresAt;
  const effectiveStatus = expired ? "RELEASED" : status;

  const map: Record<string, { bg: string; color: string; border: string; label: string; Icon: React.ElementType }> = {
    PENDING:   { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", label: "Pending",   Icon: Clock },
    CONFIRMED: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0", label: "Confirmed", Icon: CheckCircle2 },
    RELEASED:  { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", label: "Released",  Icon: XCircle },
  };
  const s = map[effectiveStatus] ?? map["RELEASED"];
  const { bg, color, border, label, Icon } = s;

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border"
      style={{ background: bg, color, borderColor: border, fontWeight: 600 }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default async function OrdersPage() {
  const orders = await getOrders();

  const pending   = orders.filter(o => o.status === "PENDING" && new Date() <= o.expiresAt).length;
  const confirmed = orders.filter(o => o.status === "CONFIRMED").length;
  const released  = orders.filter(o => o.status === "RELEASED" || (o.status === "PENDING" && new Date() > o.expiresAt)).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />

      <section className="border-b border-[#E4E4E7] bg-white">
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-10">
          <div className="fade-up">
            <p
              className="text-[10px] uppercase tracking-[0.14em] text-[#A1A1AA] mb-3"
              style={{ fontWeight: 600 }}
            >
              Orders
            </p>
            <h1
              className="text-4xl text-[#0A0A0A] tracking-tight leading-[1.1]"
              style={{ fontWeight: 800, letterSpacing: "-0.03em" }}
            >
              Reservation
              <br />
              <span className="text-[#71717A]" style={{ fontWeight: 300 }}>History</span>
            </h1>
          </div>

          <div
            className="grid grid-cols-3 mt-10 border border-[#E4E4E7] rounded-xl overflow-hidden fade-up bg-white"
            style={{ animationDelay: "60ms" }}
          >
            {[
              { label: "Active holds", value: pending, color: "#D97706" },
              { label: "Confirmed",    value: confirmed, color: "#059669" },
              { label: "Released",     value: released,  color: "#DC2626" },
            ].map(({ label, value, color }) => (
              <div key={label} className="px-6 py-5 border-r border-[#E4E4E7] last:border-r-0">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#A1A1AA] mb-2" style={{ fontWeight: 600 }}>
                  {label}
                </p>
                <p
                  className="text-[28px] leading-none"
                  style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 700, color }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {orders.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-8 h-8 text-[#A1A1AA] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#0A0A0A]">No orders yet</p>
            <p className="text-xs text-[#71717A] mt-1 font-light">Reserve a product from the catalog to see orders here.</p>
          </div>
        ) : (
          <>
            <div
              className="hidden md:grid px-5 py-2 border-b border-[#E4E4E7] mb-1"
              style={{ gridTemplateColumns: "auto 2fr 1fr 1fr 1fr 1fr" }}
            >
              {["#", "Product", "Warehouse", "Qty", "Expires", "Status"].map(h => (
                <span key={h} className="text-[10px] uppercase tracking-[0.12em] text-[#A1A1AA]" style={{ fontWeight: 600 }}>
                  {h}
                </span>
              ))}
            </div>

            <div className="divide-y divide-[#F4F4F5]">
              {orders.map((order, i) => {
                const product = order.stockItem.product;
                const warehouse = order.stockItem.warehouse;
                const expiredMs = order.expiresAt.getTime() - Date.now();
                const minutesLeft = Math.max(0, Math.ceil(expiredMs / 60000));

                return (
                  <a
                    key={order.id}
                    href={`/reservation/${order.id}`}
                    className="grid items-center gap-4 px-5 py-4 hover:bg-[#F9F9F9] transition-colors duration-150 fade-up"
                    style={{
                      gridTemplateColumns: "auto 2fr 1fr 1fr 1fr 1fr",
                      animationDelay: `${i * 30}ms`,
                      textDecoration: "none",
                    }}
                  >
                    <span
                      className="text-[11px] text-[#A1A1AA] w-6 shrink-0"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {i + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm text-[#0A0A0A] truncate" style={{ fontWeight: 600 }}>
                        {product.name}
                      </p>
                      <p
                        className="text-[10px] text-[#A1A1AA] mt-0.5"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {product.sku}
                      </p>
                    </div>

                    <div className="hidden md:flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3 h-3 text-[#A1A1AA] shrink-0" />
                      <span className="text-xs text-[#71717A] truncate">{warehouse.name}</span>
                    </div>

                    <span
                      className="text-sm text-[#0A0A0A] hidden md:block"
                      style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 600 }}
                    >
                      {order.quantity}
                    </span>

                    <div className="hidden md:block">
                      {order.status === "PENDING" && new Date() <= order.expiresAt ? (
                        <span
                          className="text-xs"
                          style={{ fontFamily: "var(--font-geist-mono)", color: minutesLeft <= 2 ? "#DC2626" : "#D97706", fontWeight: 500 }}
                        >
                          {minutesLeft}m left
                        </span>
                      ) : (
                        <span className="text-xs text-[#A1A1AA]">
                          {order.expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>

                    <StatusBadge status={order.status} expiresAt={order.expiresAt} />
                  </a>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
