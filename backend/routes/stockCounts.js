// backend/routes/stockCounts.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const toPosInt = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };

router.use(authMiddleware, checkRole(["admin"]));

/**
 * POST /api/stock-counts/commit
 * body: { branchId: number, lines: [{ productId, countedQty }]}
 * ผลลัพธ์: รายงานส่วนต่าง + มูลค่าทุน/ขาย โดยจะ apply ยอดใหม่ลง stock (MAIN)
 */
router.post("/commit", async (req, res) => {
  try {
    const branchId = toPosInt(req.body.branchId);
    const rawLines = Array.isArray(req.body.lines) ? req.body.lines : [];
    if (!branchId) return res.status(400).json({ error: "ต้องระบุ branchId" });

    const lines = rawLines
      .map((l) => ({ productId: toPosInt(l?.productId), countedQty: toPosInt(l?.countedQty) }))
      .filter((l) => l.productId && l.countedQty >= 0);

    if (!lines.length) return res.status(400).json({ error: "ไม่มีรายการนับสต็อก" });

    const report = [];

    await prisma.$transaction(async (tx) => {
      for (const { productId, countedQty } of lines) {
        const where = {
          branchId_productId_stockLocation: {
            branchId,
            productId,
            stockLocation: "MAIN",
          },
        };
        const cur = await tx.stock.findUnique({ where });

        const currentQty = cur?.quantity || 0;
        if (cur) {
          await tx.stock.update({ where, data: { quantity: countedQty } });
        } else {
          await tx.stock.create({
            data: { branchId, productId, quantity: countedQty, stockLocation: "MAIN" },
          });
        }

        // ประเมินมูลค่า (best-effort)
        const p = await tx.product.findUnique({ where: { id: productId } });
        const unitCost = p?.costPrice ?? p?.lastCost ?? 0;
        const unitPrice = p?.price ?? p?.salePrice ?? null;

        report.push({
          productId,
          currentQty,
          countedQty,
          diff: countedQty - currentQty,
          unitCost,
          unitPrice,
          diffCostValue: (countedQty - currentQty) * (unitCost || 0),
          diffSaleValue: unitPrice != null ? (countedQty - currentQty) * Number(unitPrice) : null,
        });
      }
    });

    const summary = report.reduce(
      (s, r) => {
        s.totalDiff += r.diff;
        s.totalCostValue += r.diffCostValue;
        s.totalSaleValue += r.diffSaleValue ?? 0;
        return s;
      },
      { totalDiff: 0, totalCostValue: 0, totalSaleValue: 0 }
    );

    res.json({ branchId, items: report, summary });
  } catch (e) {
    console.error("❌ stock count commit failed:", e);
    res.status(500).json({ error: e.message || "ปรับยอดสต็อกล้มเหลว" });
  }
});

module.exports = router;
