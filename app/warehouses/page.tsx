import { prisma } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { Warehouse, Package, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

async function getWarehouses() {
  return prisma.warehouse.findMany({
    include: {
      stockItems: {
        include: { product: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function WarehousesPage() {
  const warehouses = await getWarehouses();

  const totalUnits = warehouses.reduce(
    (sum, w) => sum + w.stockItems.reduce((s, i) => s + i.total, 0),
    0
  );
  const totalAvailable = warehouses.reduce(
    (sum, w) => sum + w.stockItems.reduce((s, i) => s + Math.max(0, i.total - i.reserved), 0),
    0
  );

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
              Infrastructure
            </p>
            <h1
              className="text-4xl text-[#0A0A0A] tracking-tight leading-[1.1]"
              style={{ fontWeight: 800, letterSpacing: "-0.03em" }}
            >
              Warehouse
              <br />
              <span className="text-[#71717A]" style={{ fontWeight: 300 }}>Network</span>
            </h1>
          </div>

          <div
            className="grid grid-cols-3 mt-10 border border-[#E4E4E7] rounded-xl overflow-hidden fade-up bg-white"
            style={{ animationDelay: "60ms" }}
          >
            {[
              { label: "Warehouses",      value: warehouses.length },
              { label: "Total units",     value: totalUnits.toLocaleString("en-IN") },
              { label: "Available units", value: totalAvailable.toLocaleString("en-IN") },
            ].map(({ label, value }) => (
              <div key={label} className="px-6 py-5 border-r border-[#E4E4E7] last:border-r-0">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#A1A1AA] mb-2" style={{ fontWeight: 600 }}>
                  {label}
                </p>
                <p
                  className="text-[28px] leading-none text-[#0A0A0A]"
                  style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <p
          className="text-[10px] uppercase tracking-[0.14em] text-[#A1A1AA] mb-5"
          style={{ fontWeight: 600 }}
        >
          Locations ({warehouses.length})
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((w, i) => {
            const wTotal     = w.stockItems.reduce((s, i) => s + i.total, 0);
            const wAvailable = w.stockItems.reduce((s, item) => s + Math.max(0, item.total - item.reserved), 0);
            const wReserved  = w.stockItems.reduce((s, i) => s + i.reserved, 0);
            const pct = wTotal > 0 ? (wAvailable / wTotal) * 100 : 0;

            return (
              <div
                key={w.id}
                className="border border-[#E4E4E7] rounded-xl bg-white p-5 fade-up hover:border-[#0A0A0A] transition-colors duration-200"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded bg-[#F4F4F5] flex items-center justify-center">
                        <Warehouse className="w-3.5 h-3.5 text-[#71717A]" />
                      </div>
                      <p className="text-sm text-[#0A0A0A]" style={{ fontWeight: 600 }}>
                        {w.name}
                      </p>
                    </div>
                    <p className="text-xs text-[#71717A]" style={{ fontWeight: 350 }}>
                      {w.location}
                    </p>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded border shrink-0"
                    style={{
                      background: pct > 50 ? "#ECFDF5" : pct > 15 ? "#FFFBEB" : "#FEF2F2",
                      color: pct > 50 ? "#059669" : pct > 15 ? "#D97706" : "#DC2626",
                      borderColor: pct > 50 ? "#A7F3D0" : pct > 15 ? "#FDE68A" : "#FECACA",
                      fontWeight: 600,
                    }}
                  >
                    {Math.round(pct)}% avail
                  </span>
                </div>

                {/* Stock bar */}
                <div className="stock-bar mb-3">
                  <div
                    className="stock-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: pct > 50 ? "#059669" : pct > 15 ? "#D97706" : "#DC2626",
                    }}
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  {[
                    { label: "Total",     value: wTotal },
                    { label: "Available", value: wAvailable },
                    { label: "Reserved",  value: wReserved },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#F9F9F9] rounded-lg py-2 px-1">
                      <p
                        className="text-base text-[#0A0A0A] leading-none"
                        style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}
                      >
                        {value}
                      </p>
                      <p className="text-[10px] text-[#A1A1AA] mt-0.5" style={{ fontWeight: 500 }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Product list */}
                {w.stockItems.length > 0 && (
                  <div className="border-t border-[#F4F4F5] pt-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#A1A1AA]" style={{ fontWeight: 600 }}>
                      Products
                    </p>
                    {w.stockItems.map(item => {
                      const avail = Math.max(0, item.total - item.reserved);
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Package className="w-3 h-3 text-[#A1A1AA] shrink-0" />
                            <span className="text-xs text-[#71717A] truncate">{item.product.name}</span>
                          </div>
                          <span
                            className="text-xs shrink-0"
                            style={{
                              fontFamily: "var(--font-geist-mono)",
                              fontWeight: 600,
                              color: avail === 0 ? "#DC2626" : avail <= 5 ? "#D97706" : "#059669",
                            }}
                          >
                            {avail}/{item.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
