// routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

// 📊 GET: รายงานยอดขายรวม (option: filter branch/date)
router.get("/sales", authMiddleware, async (req, res) => {
  try {
    const { branchId, date } = req.query;

    const sales = await prisma.sale.findMany({
      where: {
        ...(branchId && { branchId: Number(branchId) }),
        ...(date && {
          date: {
            gte: new Date(date + "T00:00:00.000Z"),
            lte: new Date(date + "T23:59:59.999Z"),
          },
        }),
        status: "ACTIVE", // ✅ นับเฉพาะที่ไม่ถูกยกเลิก
      },
      include: { lines: true },
    });

    const total = sales.reduce((sum, sale) => {
      return (
        sum +
        sale.lines.reduce(
          (lineSum, line) => lineSum + line.quantity * line.price,
          0
        )
      );
    }, 0);

    res.json({ total, count: sales.length });
  } catch (error) {
    console.error("❌ Sales report failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 📦 GET: รายงานการซื้อรวม (option: filter branch/date)
router.get("/purchases", authMiddleware, async (req, res) => {
  try {
    const { branchId, date } = req.query;

    const purchases = await prisma.purchase.findMany({
      where: {
        ...(branchId && { branchId: Number(branchId) }),
        ...(date && {
          date: {
            gte: new Date(date + "T00:00:00.000Z"),
            lte: new Date(date + "T23:59:59.999Z"),
          },
        }),
      },
      include: { lines: true },
    });

    const total = purchases.reduce((sum, purchase) => {
      return (
        sum +
        purchase.lines.reduce(
          (lineSum, line) => lineSum + line.quantity * line.cost,
          0
        )
      );
    }, 0);

    res.json({ total, count: purchases.length });
  } catch (error) {
    console.error("❌ Purchase report failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 📋 GET: รายงานสต็อกคงเหลือ (option: filter branch)
router.get("/stock", authMiddleware, async (req, res) => {
  try {
    const { branchId } = req.query;

    const stocks = await prisma.stock.findMany({
      where: {
        ...(branchId && { branchId: Number(branchId) }),
      },
      include: { product: true, branch: true },
      orderBy: { branchId: "asc" },
    });

    res.json(stocks);
  } catch (error) {
    console.error("❌ Stock report failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🚚 GET: รายงานการโอนสินค้าระหว่างสาขา (option: filter branch/status)
router.get("/transfers", authMiddleware, async (req, res) => {
  try {
    const { branchId, status } = req.query;

    const transfers = await prisma.transfer.findMany({
      where: {
        ...(branchId && {
          OR: [{ fromBranchId: Number(branchId) }, { toBranchId: Number(branchId) }],
        }),
        ...(status && { status }),
      },
      include: {
        fromBranch: true,
        toBranch: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(transfers);
  } catch (error) {
    console.error("❌ Transfer report failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
