const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

/* ------------ helpers ------------ */
const toPosInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
function normalizeStockLocation(input) {
  if (!input) return "MAIN";
  const up = String(input).toUpperCase().trim();
  if (up === "NORMAL") return "MAIN";
  if (up === "CONSIGNMENT") return "CONSIGN";
  return ["MAIN", "BRANCH", "CONSIGN"].includes(up) ? up : "MAIN";
}
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay   = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

/* ============ CREATE: สร้างใบซื้อ (สถานะ PENDING) ============ */
router.post("/", authMiddleware, checkRole(["admin","staff"]), async (req, res) => {
  try {
    const supplierId = toPosInt(req.body.supplierId);
    const branchId = req.body.branchId ? toPosInt(req.body.branchId) : null;
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];

    if (!supplierId) return res.status(400).json({ error: "ต้องระบุผู้ขาย (supplierId)" });
    if (!rawItems.length) return res.status(400).json({ error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" });

    const itemsToCreate = rawItems.map((it, idx) => {
      const productId   = toPosInt(it.productId);
      const orderedQty  = toPosInt(it.orderedQty);
      const usableQty   = toPosInt(it.usableQty);
      const receivedQty = toPosInt(it.receivedQty) || orderedQty;
      const defectQty   = toPosInt(it.defectQty) || 0;
      const unitCost    = Number(it.unitCost);
      if (!productId || !orderedQty || !usableQty || !Number.isFinite(unitCost)) {
        throw new Error(`แถวที่ ${idx+1}: productId/orderedQty/usableQty/unitCost ไม่ถูกต้อง`);
      }
      const totalCost = Number.isFinite(Number(it.totalCost))
        ? Number(it.totalCost)
        : unitCost * usableQty;
      const locInput = it.StockLocation || it.stockLocation || it.deliveryStockType;
      const StockLocation = normalizeStockLocation(locInput);
      return {
        productId, orderedQty, receivedQty, usableQty, defectQty,
        unitCost, totalCost, StockLocation,
      };
    });

    const docDate =
      req.body.docDate && String(req.body.docDate).trim()
        ? new Date(String(req.body.docDate))
        : new Date();

    const purchase = await prisma.purchase.create({
      data: {
        supplierId,
        branchId,
        docDate,
        // ✅ ใช้ items ให้ตรง schema
        lines: { create: itemsToCreate },
      },
      include: { lines: true, supplier: true, branch: true },
    });

    res.json(purchase);
  } catch (e) {
    console.error("❌ Purchase creation failed:", e);
    res.status(400).json({ error: e.message || "สร้างใบซื้อไม่สำเร็จ" });
  }
});

/* ============ READ: รายการ PENDING (กรอง docDate; fallback createdAt) ============ */
router.get("/pending", authMiddleware, checkRole(["admin","staff"]), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    // พยายามใช้ docDate ก่อน
    const whereDoc = { status: "PENDING" };
    if (dateFrom) whereDoc.docDate = { gte: startOfDay(String(dateFrom)) };
    if (dateTo) {
      whereDoc.docDate = whereDoc.docDate || {};
      whereDoc.docDate.lte = endOfDay(String(dateTo));
    }

    let rows;
    try {
      rows = await prisma.purchase.findMany({
        where: whereDoc,
        orderBy: { docDate: "desc" },
        include: { lines: true, supplier: true, branch: true },
      });
    } catch {
      // ถ้า DB ยังไม่มี docDate → fallback createdAt
      const whereCreated = { status: "PENDING" };
      if (dateFrom) whereCreated.createdAt = { gte: startOfDay(String(dateFrom)) };
      if (dateTo) {
        whereCreated.createdAt = whereCreated.createdAt || {};
        whereCreated.createdAt.lte = endOfDay(String(dateTo));
      }
      rows = await prisma.purchase.findMany({
        where: whereCreated,
        orderBy: { createdAt: "desc" },
        include: { lines: true, supplier: true, branch: true },
      });
    }

    res.json(rows);
  } catch (e) {
    console.error("❌ Load pending purchases failed:", e);
    res.status(500).json({ error: e.message || "โหลด PENDING ล้มเหลว" });
  }
});

/* ============ CONFIRM: ตัดสต็อกจริงแล้วเปลี่ยนสถานะ ============ */
router.post("/:id/confirm", authMiddleware, checkRole(["admin","staff"]), async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { lines: true, supplier: true, branch: true },
    });
    if (!purchase) return res.status(404).json({ error: "ไม่พบเอกสาร" });
    if (purchase.status !== "PENDING") {
      return res.status(400).json({ error: "ยืนยันได้เฉพาะเอกสารสถานะ PENDING" });
    }

    const branchId = purchase.branchId || 1;
    const items = Array.isArray(purchase.lines) ? purchase.lines : [];

    await prisma.$transaction(async (tx) => {
      for (const l of items) {
        const productId = toPosInt(l.productId);
        const qty = toPosInt(l.usableQty || 0);
        if (!productId || !qty) continue;

        const loc = normalizeStockLocation(l.StockLocation || "MAIN");

        // หา/สร้าง BranchProduct (ไม่มี unique composite → ใช้ findFirst)
        let bp = await tx.branchProduct.findFirst({ where: { branchId, productId } });
        if (!bp) {
          const prod = await tx.product.findUnique({ where: { id: productId } });
          bp = await tx.branchProduct.create({
            data: {
              branchId, productId,
              price: Number(prod?.price ?? 0),
              sku: prod?.sku || null,
              name: prod?.name || null,
            },
          });
        }

        // stock upsert โดย unique (branchProductId, StockLocation)
        await tx.stock.upsert({
          where: {
            branchProductId_StockLocation: {
              branchProductId: bp.id,
              StockLocation: loc,
            },
          },
          update: { quantity: { increment: qty } },
          create: {
            branchId,
            productId,
            branchProductId: bp.id,
            quantity: qty,
            StockLocation: loc,
          },
        });
      }

      await tx.purchase.update({
        where: { id },
        data: { status: "RECEIVED" },
      });
    });

    res.json({ id, status: "RECEIVED" });
  } catch (e) {
    console.error("❌ Confirm purchase failed:", e);
    res.status(400).json({ error: e.message || "ยืนยันรับเข้าไม่สำเร็จ" });
  }
});

module.exports = router;
