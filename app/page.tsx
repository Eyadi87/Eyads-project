import { prisma } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { ProductCard } from "@/components/product-card";
import { Package, Warehouse, TrendingUp } from "lucide-react";
import type { ProductWithStock } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<ProductWithStock[]> {
  const products = await prisma.product.findMany({
    include: {
      stockItems: {
        include: { warehouse: true },
      },
    },
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
      warehouse: {
        id: s.warehouse.id,
        name: s.warehouse.name,
        location: s.warehouse.location,
      },
    })),
  }));
}

async function getStats() {
  const [productCount, warehouseCount, totalStock] = await Promise.all([
    prisma.product.count(),
    prisma.warehouse.count(),
    prisma.stockItem.aggregate({ _sum: { total: true } }),
  ]);
  return { productCount, warehouseCount, totalStock: totalStock._sum.total ?? 0 };
}

export default async function HomePage() {
  const [products, stats] = await Promise.all([getProducts(), getStats()]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">
            Product Catalog
          </h1>
          <p className="text-[#64748B] mt-1.5 text-base">
            Reserve units from any warehouse — holds expire in 10 minutes.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { icon: Package, label: "Products", value: stats.productCount },
              { icon: Warehouse, label: "Warehouses", value: stats.warehouseCount },
              { icon: TrendingUp, label: "Total Units", value: stats.totalStock.toLocaleString("en-IN") },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 bg-white border border-[#E6E8EA] rounded-xl px-4 py-2.5 shadow-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#334155]" />
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8] font-medium">{label}</p>
                  <p className="text-sm font-bold text-[#0F172A] tabular-nums leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#0F172A]">No products yet</h3>
            <p className="text-[#64748B] mt-1 text-sm">Run the seed script to populate the catalog.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#E6E8EA] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <p className="text-xs text-[#94A3B8]">Allo Health Inventory — Take-Home Exercise</p>
          <p className="text-xs text-[#94A3B8]">Reservations expire after 10 min</p>
        </div>
      </footer>
    </div>
  );
}
