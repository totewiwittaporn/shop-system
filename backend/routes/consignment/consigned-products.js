const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* ------------ utils ------------- */
const toPosInt = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };
const toBool = (v) => (typeof v === "string" ? v.toLowerCase() : v) === true || (""+v).toLowerCase()==="true";

/* ------------ LIST ---------------
GET /api/v1/consigned-products?shopId=&productId=&active=&q=&page=1&pageSize=50
-----------------------------------*/
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(1000, Math.max(1, Number(req.query.pageSize || 50)));
    const shopId = toPosInt(req.query.shopId);
    const productId = toPosInt(req.query.productId);
    const q = (req.query.q || "").trim();
    const active = req.query.active != null ? toBool(req.query.active) : undefined;

    const where = {};
    if (shopId) where.shopId = shopId;
    if (productId) where.productId = productId;
    if (typeof active === "boolean") where.active = active;
    if (q) {
      // ค้นหาชื่อสินค้าจาก Product.name
      where.product = { name: { contains: q, mode: "insensitive" } };
    }

    const [total, rows] = await Promise.all([
      prisma.consignedProduct.count({ where }),
      prisma.consignedProduct.findMany({
        where,
        orderBy: [{ shopId: "asc" }, { productId: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { product: true, shop: true },
      }),
    ]);

    res.json({ page, pageSize, total, data: rows });
  } catch (e) {
    console.error("❌ list consigned-products failed:", e);
    res.status(500).json({ error: e.message || "โหลดข้อมูลล้มเหลว" });
  }
});

/* ------------ GET BY ID ---------- */
router.get("/:id", async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });
    const row = await prisma.consignedProduct.findUnique({
      where: { id },
      include: { product: true, shop: true },
    });
    if (!row) return res.status(404).json({ error: "ไม่พบรายการ" });
    res.json(row);
  } catch (e) {
    console.error("❌ get consigned-product failed:", e);
    res.status(500).json({ error: e.message || "โหลดข้อมูลล้มเหลว" });
  }
});

/* ------------ CREATE -------------
POST { shopId, productId, price, active? }
-----------------------------------*/
router.post("/", async (req, res) => {
  try {
    const shopId = toPosInt(req.body.shopId);
    const productId = toPosInt(req.body.productId);
    const price = Number(req.body.price);
    const active = req.body.active == null ? true : toBool(req.body.active);

    if (!shopId || !productId || !Number.isFinite(price) || price < 0) {
      return res.status(400).json({ error: "กรุณาระบุ shopId/productId/price ให้ถูกต้อง" });
    }

    // ตรวจว่ามี shop/product จริง
    const [shop, product] = await Promise.all([
      prisma.consignmentShop.findUnique({ where: { id: shopId }, select: { id: true } }),
      prisma.product.findUnique({ where: { id: productId }, select: { id: true } }),
    ]);
    if (!shop) return res.status(400).json({ error: "ไม่พบร้านฝากขาย" });
    if (!product) return res.status(400).json({ error: "ไม่พบสินค้า" });

    const created = await prisma.consignedProduct.create({
      data: { shopId, productId, price, active },
    });
    res.json(created);
  } catch (e) {
    if (e?.code === "P2002") {
      return res.status(409).json({ error: "ซ้ำ: ร้านนี้มีสินค้านี้อยู่แล้ว" });
    }
    console.error("❌ create consigned-product failed:", e);
    res.status(500).json({ error: e.message || "บันทึกไม่สำเร็จ" });
  }
});

/* ------------ UPDATE -------------
PUT /:id  { price?, active? }
-----------------------------------*/
router.put("/:id", async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    const data = {};
    if (req.body.price != null) {
      const price = Number(req.body.price);
      if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: "price ไม่ถูกต้อง" });
      data.price = price;
    }
    if (req.body.active != null) data.active = toBool(req.body.active);

    const updated = await prisma.consignedProduct.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (e) {
    console.error("❌ update consigned-product failed:", e);
    res.status(500).json({ error: e.message || "อัปเดตไม่สำเร็จ" });
  }
});

/* ------------ DELETE ------------- */
router.delete("/:id", async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });
    await prisma.consignedProduct.delete({ where: { id } });
    res.json({ message: "ลบสำเร็จ" });
  } catch (e) {
    console.error("❌ delete consigned-product failed:", e);
    res.status(500).json({ error: e.message || "ลบไม่สำเร็จ" });
  }
});

module.exports = router;
