// backend/routes/dashboardRoutes.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/summary", authMiddleware, checkRole(["admin","staff"]), async (req, res) => {
  try {
    // รวมยอดซื้อจาก purchase.lines
    const purchases = await prisma.purchase.findMany({
      include: { lines: true } // ← ใช้ lines ให้ตรง schema
    });

    const totalPurchase = purchases.reduce((sum, p) => {
      const sub = p.lines?.reduce((s, l) => s + (Number(l.totalCost) || 0), 0) || 0;
      return sum + sub;
    }, 0);

    res.json({ totalPurchase });
  } catch (e) {
    console.error("❌ Summary error:", e);
    res.status(500).json({ error: "โหลดสรุปล้มเหลว" });
  }
});

module.exports = router;
