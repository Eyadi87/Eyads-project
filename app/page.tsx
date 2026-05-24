import { prisma } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { ProductRow } from "@/components/product-row";
import { Package, Warehouse, ShieldCheck, Clock } from "lucide-react";
import type { ProductWithStock } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<ProductWithStock[]> {
  const products = await prisma.product.findMany({
    include: { stockItems: { include: { warehouse: true } } },
    orderBy: { createdAt: "asc" },
  });
  return products.map((p) => ({
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
      warehouse: { id: s.warehouse.id, name: s.warehouse.name, location: s.warehouse.location },
    })),
  }));
}

async function getStats() {
  const [productCount, warehouseCount, stockAgg, activeReservations] = await Promise.all([
    prisma.product.count(),
    prisma.warehouse.count(),
    prisma.stockItem.aggregate({ _sum: { total: true, reserved: true } }),
    prisma.reservation.count({ where: { status: "PENDING", expiresAt: { gt: new Date() } } }),
  ]);
  return {
    productCount,
    warehouseCount,
    totalUnits: stockAgg._sum.total ?? 0,
    reservedUnits: stockAgg._sum.reserved ?? 0,
    activeReservations,
  };
}

export default async function HomePage() {
  const [products, stats] = await Promise.all([getProducts(), getStats()]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-[#E4E4E7] bg-white">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-12">
          <div className="fade-up">
            <div className="flex items-center gap-2 mb-6">
              <span className="tag tag-green" style={{ fontFamily: "var(--font-geist-mono)" }}>Live</span>
              <span className="text-xs font-light text-[#71717A]">Real-time inventory across all warehouses</span>
            </div>

            <h1
              className="text-5xl text-[#0A0A0A] tracking-tight leading-[1.08] max-w-2xl"
              style={{ fontWeight: 800, letterSpacing: "-0.03em" }}
            >
              Inventory
              <br />
              <span className="text-[#71717A]" style={{ fontWeight: 300 }}>Reservation Platform</span>
            </h1>

            <p className="text-[15px] font-light text-[#71717A] mt-5 max-w-lg leading-relaxed" style={{ fontWeight: 350 }}>
              Reserve units from any warehouse. Each hold is valid for 10 minutes.
              Confirm to complete purchase or cancel to return stock.
            </p>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 mt-12 border border-[#E4E4E7] rounded-xl overflow-hidden fade-up bg-white"
            style={{ animationDelay: "80ms" }}
          >
            {[
              { label: "Products", value: stats.productCount, icon: Package },
              { label: "Warehouses", value: stats.warehouseCount, icon: Warehouse },
              { label: "Available units", value: (stats.totalUnits - stats.reservedUnits).toLocaleString("en-IN"), icon: ShieldCheck },
              { label: "Active holds", value: stats.activeReservations, icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="px-6 py-5 flex flex-col gap-2 border-r border-[#E4E4E7] last:border-r-0 border-b sm:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span
                    className="text-[10px] uppercase tracking-[0.12em] text-[#A1A1AA]"
                    style={{ fontWeight: 600 }}
                  >
                    {label}
                  </span>
                </div>
                <p
                  className="text-[28px] text-[#0A0A0A] leading-none"
                  style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-[#E4E4E7]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p
            className="text-[10px] uppercase tracking-[0.14em] text-[#A1A1AA] mb-8"
            style={{ fontWeight: 600 }}
          >
            How it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Browse and reserve",
                body: "Select a product and warehouse below. Click Reserve to hold your unit. Stock is locked instantly using an atomic database transaction that prevents double-booking.",
              },
              {
                step: "02",
                title: "Complete checkout",
                body: "You have 10 minutes to complete your purchase. A live countdown shows time remaining. If the timer runs out, the hold releases automatically and stock returns to inventory.",
              },
              {
                step: "03",
                title: "Confirm or cancel",
                body: "Click Confirm purchase to finalize the order. Stock is permanently decremented. Click Cancel at any time to return the unit to available inventory immediately.",
              },
            ].map(({ step, title, body }, i) => (
              <div
                key={step}
                className="fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <p
                  className="text-xs text-[#059669] mb-3"
                  style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}
                >
                  {step}
                </p>
                <p className="text-sm text-[#0A0A0A] mb-2" style={{ fontWeight: 600 }}>{title}</p>
                <p className="text-sm text-[#71717A] leading-relaxed" style={{ fontWeight: 350 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product table */}
      <section className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-5">
          <p
            className="text-[10px] uppercase tracking-[0.14em] text-[#A1A1AA]"
            style={{ fontWeight: 600 }}
          >
            Products ({products.length})
          </p>
          <p className="text-xs font-light text-[#A1A1AA]">Click any row to see warehouse breakdown</p>
        </div>

        {/* Table header */}
        <div
          className="hidden md:grid px-6 py-2 border-b border-[#E4E4E7]"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr auto" }}
        >
          {["Product", "SKU", "Price", "Stock", "Status"].map((h) => (
            <span
              key={h}
              className="text-[10px] uppercase tracking-[0.12em] text-[#A1A1AA]"
              style={{ fontWeight: 600 }}
            >
              {h}
            </span>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-8 h-8 text-[#A1A1AA] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#0A0A0A]">No products</p>
            <p className="text-xs font-light text-[#71717A] mt-1">Run the seed script to populate the catalog.</p>
          </div>
        ) : (
          <div>
            {products.map((product, i) => (
              <ProductRow key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E4E4E7] mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-sm bg-[#0A0A0A]" />
            <p className="text-xs font-light text-[#A1A1AA]" style={{ fontWeight: 350 }}>Allo Health Inventory Platform</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-light text-[#A1A1AA]" style={{ fontWeight: 350 }}>
            <span>Reservations expire after 10 minutes</span>
            <span className="text-[#E4E4E7]">|</span>
            <span>PostgreSQL atomic concurrency</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
