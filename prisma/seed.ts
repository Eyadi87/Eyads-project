import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.idempotencyRecord.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const [wh1, wh2, wh3] = await Promise.all([
    prisma.warehouse.create({ data: { name: "Mumbai Central", location: "Mumbai, MH" } }),
    prisma.warehouse.create({ data: { name: "Delhi North", location: "Delhi, DL" } }),
    prisma.warehouse.create({ data: { name: "Bangalore South", location: "Bangalore, KA" } }),
  ]);

  const products = [
    { name: "Testosterone Support Kit", description: "Clinically-backed testosterone optimization supplement kit", price: "2499.00", sku: "TSK-001", imageUrl: null },
    { name: "Men's Wellness Bundle", description: "Complete men's health and vitality supplement bundle", price: "3999.00", sku: "MWB-002", imageUrl: null },
    { name: "Sleep & Recovery Formula", description: "Advanced sleep optimization and muscle recovery blend", price: "1299.00", sku: "SRF-003", imageUrl: null },
    { name: "Performance Protein Stack", description: "High-performance whey protein with bioavailability enhancers", price: "4599.00", sku: "PPS-004", imageUrl: null },
    { name: "Gut Health Probiotic", description: "Multi-strain probiotic for digestive health and immunity", price: "899.00", sku: "GHP-005", imageUrl: null },
    { name: "Stress Relief Ashwagandha", description: "KSM-66 ashwagandha root extract for cortisol management", price: "699.00", sku: "SRA-006", imageUrl: null },
  ];

  const created = await Promise.all(products.map(p => prisma.product.create({ data: p })));

  const stockData = [
    { productId: created[0].id, warehouseId: wh1.id, total: 50 },
    { productId: created[0].id, warehouseId: wh2.id, total: 30 },
    { productId: created[0].id, warehouseId: wh3.id, total: 1 },
    { productId: created[1].id, warehouseId: wh1.id, total: 25 },
    { productId: created[1].id, warehouseId: wh2.id, total: 40 },
    { productId: created[2].id, warehouseId: wh1.id, total: 100 },
    { productId: created[2].id, warehouseId: wh3.id, total: 15 },
    { productId: created[3].id, warehouseId: wh2.id, total: 0 },
    { productId: created[3].id, warehouseId: wh3.id, total: 8 },
    { productId: created[4].id, warehouseId: wh1.id, total: 200 },
    { productId: created[4].id, warehouseId: wh2.id, total: 75 },
    { productId: created[4].id, warehouseId: wh3.id, total: 2 },
    { productId: created[5].id, warehouseId: wh1.id, total: 60 },
    { productId: created[5].id, warehouseId: wh3.id, total: 1 },
  ];

  await Promise.all(stockData.map(s => prisma.stockItem.create({ data: s })));

  console.log(`Seeded: 3 warehouses, ${products.length} products, ${stockData.length} stock items`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
