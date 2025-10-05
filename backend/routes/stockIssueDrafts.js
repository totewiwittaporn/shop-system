// backend/routes/stockIssueDrafts.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

/* ============ Utils ============ */
const toPosInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** สร้าง snapshot บรรทัดจาก shop mapping/consigned price */
async function buildSnapshotLines(shopId, draftLines) {
  const clean = (Array.isArray(draftLines) ? draftLines : [])
    .map((l) => ({
      productId: toPosInt(l?.productId),
      // รองรับทั้ง quantity และ qty
      quantity: toPosInt(l?.quantity ?? l?.qty),
    }))
    .filter((l) => l.productId && l.quantity);

  if (!clean.length) throw new Error("ต้องมีรายการสินค้า (productId/quantity > 0)");

  async function one(productId, quantity) {
    const [map, consigned, product] = await Promise.all([
      prisma.shopProductMap.findUnique({
        where: { shopId_productId: { shopId, productId } },
        include: { shopCategory: true },
      }),
      // ราคาใช้จาก mapping > ไม่มีก็ใช้จาก consignedProduct
      prisma.consignedProduct.findFirst({ where: { shopId, productId } }),
      prisma.product.findUnique({
        where: { id: productId },
        include: { category: true },
      }),
    ]);

    const productName = map?.shopName || product?.name || `#${productId}`;
    const unitPrice =
      typeof map?.priceOverride === "number"
        ? map.priceOverride
        : typeof consigned?.price === "number"
        ? consigned.price
        : null;

    return {
      productId,
      productName,
      sku: map?.shopSku || null,
      quantity,
      unitPrice,
      amount: unitPrice != null ? Number(unitPrice) * Number(quantity) : null,
      partnerCategoryCode: map?.shopCategory?.code || null,
      partnerCategoryName: map?.shopCategory?.name || null,
      deliveryStockType: "CONSIGNMENT",
    };
  }

  return Promise.all(clean.map((l) => one(l.productId, l.quantity)));
}

/* ============ Middleware ============ */
router.use(authMiddleware);

/* ============ Create Draft ============ */
router.post("/", async (req, res) => {
  try {
    const fromBranchId = toPosInt(req.body.fromBranchId);
    const toShopId = toPosInt(req.body.toShopId);
    const lines = Array.isArray(req.body.lines) ? req.body.lines : [];

    const userId = toPosInt(req.user?.id || req.user?.userId);
    if (!userId) return res.status(401).json({ error: "ไม่พบ userId ใน token (createdBy)" });

    if (!fromBranchId) return res.status(400).json({ error: "ต้องระบุสาขาต้นทาง" });
    if (!toShopId) return res.status(400).json({ error: "ต้องระบุร้านฝากขายปลายทาง" });
    if (!lines.length || !lines.every((l) => toPosInt(l.productId) && toPosInt(l.qty)))
      return res.status(400).json({ error: "ต้องมีรายการสินค้า (productId/qty > 0)" });

    const created = await prisma.stockIssueDraft.create({
      data: {
        fromBranchId,
        toShopId,
        status: "DRAFT",
        createdBy: userId,
        lines: {
          create: lines.map((l) => ({
            productId: toPosInt(l.productId),
            qty: toPosInt(l.qty),
          })),
        },
      },
      include: { lines: true },
    });

    res.json({ id: created.id, status: created.status });
  } catch (e) {
    console.error("❌ Create draft failed:", e);
    res.status(500).json({ error: e.message || "บันทึกร่างล้มเหลว" });
  }
});

/* ============ List Drafts (with filters) ============ */
router.get("/", async (req, res) => {
  try {
    const { status, fromBranchId, toShopId } = req.query;
    const where = {};
    if (status) where.status = String(status);
    if (toPosInt(fromBranchId)) where.fromBranchId = toPosInt(fromBranchId);
    if (toPosInt(toShopId)) where.toShopId = toPosInt(toShopId);

    const drafts = await prisma.stockIssueDraft.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { lines: true },
    });
    res.json(drafts);
  } catch (e) {
    console.error("❌ List drafts failed:", e);
    res.status(500).json({ error: "โหลดร่างล้มเหลว" });
  }
});

/* ============ Get One Draft ============ */
router.get("/:id", async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });
    const draft = await prisma.stockIssueDraft.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!draft) return res.status(404).json({ error: "ไม่พบร่างนี้" });
    res.json(draft);
  } catch (e) {
    console.error("❌ Get draft failed:", e);
    res.status(500).json({ error: "โหลดร่างล้มเหลว" });
  }
});

/* ============ Confirm Draft → DeliveryDoc(PENDING) ============ */
router.post("/:id/confirm", async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    const draft = await prisma.stockIssueDraft.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!draft) return res.status(404).json({ error: "ไม่พบร่างนี้" });
    if (draft.status !== "DRAFT")
      return res.status(400).json({ error: "ยืนยันได้เฉพาะเอกสารสถานะ DRAFT" });

    const normalized = draft.lines.map((l) => ({
      productId: l.productId,
      quantity: Number(l.qty || 0),
    }));

    const snapshotLines = await buildSnapshotLines(draft.toShopId, normalized);

    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.deliveryDoc.create({
        data: {
          shopId: draft.toShopId,
          fromBranchId: draft.fromBranchId,
          status: "PENDING",
          lines: { create: snapshotLines },
        },
        include: { lines: true },
      });

      await tx.stockIssueDraft.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });

      return created;
    });

    res.json(doc);
  } catch (e) {
    console.error("❌ Confirm draft failed:", e);
    res.status(500).json({ error: e.message || "ยืนยันร่างล้มเหลว" });
  }
});

/* ============ Delete Draft (optional) ============ */
router.delete("/:id", async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    await prisma.$transaction(async (tx) => {
      await tx.stockIssueDraftLine.deleteMany({ where: { draftId: id } });
      await tx.stockIssueDraft.delete({ where: { id } });
    });

    res.json({ message: "ลบร่างสำเร็จ" });
  } catch (e) {
    console.error("❌ Delete draft failed:", e);
    res.status(500).json({ error: "ลบร่างล้มเหลว" });
  }
});

module.exports = router;
