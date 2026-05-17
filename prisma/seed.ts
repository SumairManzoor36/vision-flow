import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";

// `tsx prisma/seed.ts` does not auto-load .env files the way the Prisma CLI
// does. When `npm run db:seed` is invoked directly (without first sourcing
// .env.production), DATABASE_URL is missing and PrismaClient blows up.
// loadEnvFile() is a no-op for vars that are already exported, so this is
// safe under deploy.sh / Plesk (real env always wins).
for (const file of [".env.production", ".env"]) {
  if (existsSync(file)) {
    try {
      loadEnvFile(file);
    } catch {
      /* ignore parse errors — fall through to next file */
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Vision Audit Flow Pro database...");

  // Users
  const adminPwd = await bcrypt.hash("admin1234", 12);
  const managerPwd = await bcrypt.hash("manager1234", 12);
  const auditorPwd = await bcrypt.hash("auditor1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@vision-audit.app" },
    update: {},
    create: {
      email: "admin@vision-audit.app",
      name: "Alex Admin",
      password: adminPwd,
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@vision-audit.app" },
    update: {},
    create: {
      email: "manager@vision-audit.app",
      name: "Morgan Manager",
      password: managerPwd,
      role: "MANAGER",
    },
  });

  const auditor = await prisma.user.upsert({
    where: { email: "auditor@vision-audit.app" },
    update: {},
    create: {
      email: "auditor@vision-audit.app",
      name: "Jordan Auditor",
      password: auditorPwd,
      role: "AUDITOR",
    },
  });

  console.log("✓ Users created");

  // Categories
  const beverages = await prisma.category.upsert({
    where: { slug: "beverages" },
    update: {},
    create: { name: "Beverages", slug: "beverages", color: "#3a64ff", icon: "Coffee" },
  });
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics", color: "#a855f7", icon: "Cpu" },
  });
  const apparel = await prisma.category.upsert({
    where: { slug: "apparel" },
    update: {},
    create: { name: "Apparel", slug: "apparel", color: "#ec4899", icon: "Shirt" },
  });

  console.log("✓ Categories created");

  // Locations
  const wh1 = await prisma.location.upsert({
    where: { code: "WH-NYC-01" },
    update: {},
    create: {
      name: "New York Distribution Center",
      code: "WH-NYC-01",
      type: "WAREHOUSE",
      address: "100 Logistics Blvd",
      city: "New York",
      country: "USA",
      manager: "Morgan Manager",
    },
  });
  const wh2 = await prisma.location.upsert({
    where: { code: "WH-LAX-01" },
    update: {},
    create: {
      name: "Los Angeles Hub",
      code: "WH-LAX-01",
      type: "WAREHOUSE",
      address: "500 Pacific Ave",
      city: "Los Angeles",
      country: "USA",
    },
  });
  const store1 = await prisma.location.upsert({
    where: { code: "ST-SF-01" },
    update: {},
    create: {
      name: "SoMa Flagship Store",
      code: "ST-SF-01",
      type: "STORE",
      address: "33 Mission St",
      city: "San Francisco",
      country: "USA",
    },
  });

  console.log("✓ Locations created");

  // Products
  const productSeeds = [
    { sku: "BEV-001", name: "Cola Classic 12oz Can", barcode: "049000001", categoryId: beverages.id, costPrice: 0.45, sellPrice: 1.5, reorderPoint: 50, reorderQty: 200 },
    { sku: "BEV-002", name: "Sparkling Water Lemon 16oz", barcode: "049000002", categoryId: beverages.id, costPrice: 0.6, sellPrice: 1.8, reorderPoint: 40, reorderQty: 150 },
    { sku: "BEV-003", name: "Cold Brew Coffee 12oz", barcode: "049000003", categoryId: beverages.id, costPrice: 1.2, sellPrice: 3.5, reorderPoint: 30, reorderQty: 100 },
    { sku: "ELC-001", name: "Wireless Earbuds Pro", barcode: "850000001", categoryId: electronics.id, costPrice: 35, sellPrice: 99, reorderPoint: 20, reorderQty: 80 },
    { sku: "ELC-002", name: "USB-C Charging Cable 6ft", barcode: "850000002", categoryId: electronics.id, costPrice: 2.5, sellPrice: 14.99, reorderPoint: 50, reorderQty: 200 },
    { sku: "ELC-003", name: "Bluetooth Speaker Mini", barcode: "850000003", categoryId: electronics.id, costPrice: 18, sellPrice: 49.99, reorderPoint: 15, reorderQty: 60 },
    { sku: "APP-001", name: "Classic Cotton Tee — Black, M", barcode: "100000001", categoryId: apparel.id, costPrice: 4.5, sellPrice: 19.99, reorderPoint: 25, reorderQty: 100 },
    { sku: "APP-002", name: "Slim Denim Jeans — Indigo, 32x32", barcode: "100000002", categoryId: apparel.id, costPrice: 12, sellPrice: 59, reorderPoint: 15, reorderQty: 50 },
  ];

  for (const p of productSeeds) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }
  console.log("✓ Products created");

  // Stock items (assign to warehouses)
  const allProducts = await prisma.product.findMany();
  for (const p of allProducts) {
    for (const loc of [wh1, wh2, store1]) {
      await prisma.stockItem.upsert({
        where: { productId_locationId: { productId: p.id, locationId: loc.id } },
        update: {},
        create: {
          productId: p.id,
          locationId: loc.id,
          quantity: Math.floor(Math.random() * 120) + 5,
        },
      });
    }
  }
  console.log("✓ Stock items created");

  // Demo audits
  const audit1 = await prisma.audit.create({
    data: {
      code: "AUD-DEMO-0001",
      title: "Q4 Aisle 7 spot check",
      description: "Quarterly verification of beverage aisle stock levels.",
      status: "COMPLETED",
      method: "AI_VISION",
      locationId: wh1.id,
      createdById: auditor.id,
      assignedToId: auditor.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      totalItems: 248,
      matchedItems: 232,
      discrepancies: 4,
      aiConfidence: 0.91,
      aiSummary:
        "Inventory in beverage aisle 7 is 94% accurate. Minor under-count on Cold Brew Coffee 12oz (4 units short of expected). Recommend reorder before next promotional event.",
    },
  });

  const audit2 = await prisma.audit.create({
    data: {
      code: "AUD-DEMO-0002",
      title: "Electronics receiving — pallet 14",
      description: "AI verification of a receiving pallet against PO.",
      status: "REVIEW",
      method: "AI_VISION",
      locationId: wh2.id,
      createdById: auditor.id,
      assignedToId: manager.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      totalItems: 80,
      matchedItems: 76,
      discrepancies: 2,
      aiConfidence: 0.88,
      aiSummary:
        "Receiving pallet 14 contains 76 of 80 expected units. 2 units missing (USB-C cables). Possibly damaged packaging — recommend physical inspection.",
    },
  });

  await prisma.audit.create({
    data: {
      code: "AUD-DEMO-0003",
      title: "Storefront monthly count",
      status: "DRAFT",
      method: "AI_VISION",
      locationId: store1.id,
      createdById: admin.id,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    },
  });

  console.log("✓ Audits created");

  // AI Insights
  await prisma.aiInsight.createMany({
    data: [
      {
        title: "Cold Brew Coffee under-stocked at NYC",
        category: "stock",
        severity: "MEDIUM",
        summary:
          "Cold Brew Coffee 12oz is 12% below reorder point at the New York Distribution Center. Demand is trending up week-over-week.",
        details:
          "Recent audits show consistent shortfall. Recommend triggering an immediate purchase order for 100 units to avoid stockout during promotional period.",
        modelUsed: "gemini-1.5-pro",
      },
      {
        title: "Discrepancy pattern at LAX receiving",
        category: "operations",
        severity: "HIGH",
        summary:
          "USB-C cables have shown discrepancies in 3 of the last 5 receiving audits at LA Hub. Possible supplier issue.",
        details:
          "Pattern suggests packaging may be damaged in transit. Recommend audit of shipping containers and contact with logistics partner.",
        modelUsed: "gemini-1.5-pro",
      },
      {
        title: "Storefront on track for monthly target",
        category: "performance",
        severity: "LOW",
        summary: "SoMa Flagship Store is 8% ahead of monthly inventory turnover target.",
        modelUsed: "gemini-1.5-pro",
      },
    ],
  });

  console.log("✓ AI insights created");

  // Activity log
  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "user.login",
      },
      {
        userId: auditor.id,
        action: "audit.created",
        entity: "audit",
        entityId: audit1.id,
      },
      {
        userId: auditor.id,
        action: "audit.scanned",
        entity: "audit",
        entityId: audit1.id,
        metadata: { itemsDetected: 12, model: "gemini-2.0-flash-exp" },
      },
      {
        userId: manager.id,
        action: "audit.completed",
        entity: "audit",
        entityId: audit1.id,
      },
      {
        userId: auditor.id,
        action: "audit.scanned",
        entity: "audit",
        entityId: audit2.id,
        metadata: { itemsDetected: 8, model: "gemini-2.0-flash-exp" },
      },
    ],
  });

  console.log("✓ Activity log seeded");

  console.log("\n🎉 Seed complete!\n");
  console.log("Login credentials:");
  console.log("  Admin   → admin@vision-audit.app   / admin1234");
  console.log("  Manager → manager@vision-audit.app / manager1234");
  console.log("  Auditor → auditor@vision-audit.app / auditor1234");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
