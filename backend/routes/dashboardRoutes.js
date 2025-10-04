// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

// 📊 GET: Dashboard Summary
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    // รวมยอดขายจาก Order
    const orders = await prisma.order.findMany({ include: { items: true } });
    const totalSales = orders.reduce(
      (sum, order) =>
        sum +
        order.items.reduce((itemSum, item) => itemSum + item.amount, 0),
      0
    );

    // รวมยอดซื้อ
    const purchases = await prisma.purchase.findMany({ include: { items: true } });
    const totalPurchases = purchases.reduce(
      (sum, purchase) =>
        sum +
        purchase.items.reduce((itemSum, item) => itemSum + item.totalCost, 0),
      0
    );

    // จำนวนสินค้าและสาขา
    const totalProducts = await prisma.product.count();
    const totalBranches = await prisma.branch.count();

    res.json({
      totalSales,
      totalPurchases,
      totalProducts,
      totalBranches,
    });
  } catch (err) {
    console.error("❌ Summary error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📈 GET: Dashboard Chart Data (ยอดขายรายวัน)
router.get("/orders/daily", authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: "PAID" }, // เฉพาะ order ที่จ่ายแล้ว
      include: { items: true },
      orderBy: { createdAt: "asc" },
    });

    const daily = {};
    orders.forEach((order) => {
      const day = order.createdAt.toISOString().split("T")[0];
      const amount = order.items.reduce((sum, item) => sum + item.amount, 0);
      daily[day] = (daily[day] || 0) + amount;
    });

    res.json(daily);
  } catch (err) {
    console.error("❌ Dashboard orders daily failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📊 GET: Dashboard Stock Summary by Branch
router.get("/stock/branches", authMiddleware, async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      include: { branch: true },
    });

    const branchSummary = {};
    stocks.forEach((s) => {
      const branch = s.branch.name;
      branchSummary[branch] = (branchSummary[branch] || 0) + s.quantity;
    });

    res.json(branchSummary);
  } catch (err) {
    console.error("❌ Dashboard stock branches failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET: Top 10 ขายดี (จาก OrderItem)
router.get("/top-products", authMiddleware, async (req, res) => {
  try {
    const topItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    const result = await Promise.all(
      topItems.map(async (item) => {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        return {
          product: product?.name || "Unknown",
          quantity: item._sum.quantity || 0,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("❌ Top-products error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
