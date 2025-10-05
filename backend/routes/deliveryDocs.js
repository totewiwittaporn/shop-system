// backend/routes/deliveryDocs.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

const toPosInt = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };

// ===== สร้าง snapshot จาก mapping/consigned price =====
async function buildSnapshotLines(shopId, rawLines) {
  const lines = (Array.isArray(rawLines) ? rawLines : [])
    .map((l) => ({ productId: toPosInt(l?.productId), quantity: toPosInt(l?.quantity) }))
    .filter((l) => l.productId && l.quantity);
  if (!lines.length) throw new Error("ต้องมีรายการสินค้า (productId/quantity > 0)");

  const out = [];
  for (const { productId, quantity } of lines) {
    const [map, consigned, product] = await Promise.all([
      prisma.shopProductMap.findUnique({
        where: { shopId_productId: { shopId, productId } },
        include: { shopCategory: true },
      }),
      prisma.consignedProduct.findFirst({ where: { shopId, productId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);

    const productName = map?.shopName || product?.name || `#${productId}`;
    const unitPrice =
      typeof map?.priceOverride === "number"
        ? map.priceOverride
        : typeof consigned?.price === "number"
        ? consigned.price
        : null;

    out.push({
      productId, productName, sku: map?.shopSku || null,
      quantity,
      unitPrice,
      amount: unitPrice != null ? Number(unitPrice) * Number(quantity) : null,
      partnerCategoryCode: map?.shopCategory?.code || null,
      partnerCategoryName: map?.shopCategory?.name || null,
      deliveryStockType: "CONSIGNMENT",
    });
  }
  return out;
}

router.use(authMiddleware);

// GET list (คงของเดิม)
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.query.shopId) where.shopId = toPosInt(req.query.shopId);
    if (req.query.fromBranchId) where.fromBranchId = toPosInt(req.query.fromBranchId);
    if (req.query.status) where.status = String(req.query.status);

    const docs = await prisma.deliveryDoc.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { lines: true, template: true },
      take: 200,
    });
    res.json(docs);
  } catch (e) {
    console.error("❌ load delivery docs failed:", e);
    res.status(500).json({ error: "โหลดใบส่งของล้มเหลว" });
  }
});

// POST create (ฟอร์มเดียว)
router.post("/", async (req, res) => {
  try {
    const shopId = toPosInt(req.body.shopId);
    const fromBranchId = toPosInt(req.body.fromBranchId) || null;
    const templateId = toPosInt(req.body.templateId) || null;
    if (!shopId) return res.status(400).json({ error: "shopId ต้องไม่ว่าง" });

    const snapshotLines = await buildSnapshotLines(shopId, req.body.lines || []);

    const created = await prisma.deliveryDoc.create({
      data: {
        shopId,
        fromBranchId,
        templateId,
        status: "PENDING",
        lines: { create: snapshotLines },
      },
      include: { lines: true, template: true },
    });

    res.json(created);
  } catch (e) {
    console.error("❌ create delivery doc failed:", e);
    res.status(500).json({ error: e.message || "สร้างใบส่งของล้มเหลว" });
  }
});

// PUT status (ตัดสต็อกจริงตอนเปลี่ยนสถานะ)
router.put("/:id/status", async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    const status = String(req.body.status || "");
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });
    if (!["PENDING", "SHIPPED", "RECEIVED", "CANCELED"].includes(status))
      return res.status(400).json({ error: "สถานะไม่ถูกต้อง" });

    const doc = await prisma.deliveryDoc.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!doc) return res.status(404).json({ error: "ไม่พบเอกสาร" });

    // ตัวอย่าง: ตัดสต็อกจากสาขาต้นทางตอน SHIPPED
    if (status === "SHIPPED") {
      if (!doc.fromBranchId) return res.status(400).json({ error: "เอกสารนี้ไม่มีสาขาต้นทาง" });

      await prisma.$transaction(async (tx) => {
        for (const l of doc.lines) {
          // ลด stock MAIN ของสาขา
          const where = {
            branchId_productId_stockLocation: {
              branchId: doc.fromBranchId,
              productId: l.productId,
              stockLocation: "MAIN",
            },
          };
          const existing = await tx.stock.findUnique({ where });
          const newQty = (existing?.quantity || 0) - (l.quantity || 0);
          if (!existing || newQty < 0) {
            throw new Error(`สต็อกไม่พอสำหรับสินค้า #${l.productId}`);
          }
          await tx.stock.update({ where, data: { quantity: newQty } });
        }

        await tx.deliveryDoc.update({ where: { id }, data: { status } });
      });
    } else if (status === "RECEIVED") {
      // ถ้าต้องการบวกเข้าสต็อกร้านฝากขายจริง ๆ ต้องมีตาราง consignmentStock
      await prisma.deliveryDoc.update({ where: { id }, data: { status } });
    } else {
      await prisma.deliveryDoc.update({ where: { id }, data: { status } });
    }

    const fresh = await prisma.deliveryDoc.findUnique({ where: { id }, include: { lines: true } });
    res.json(fresh);
  } catch (e) {
    console.error("❌ update delivery status failed:", e);
    res.status(500).json({ error: e.message || "อัปเดตสถานะล้มเหลว" });
  }
});

module.exports = router;
