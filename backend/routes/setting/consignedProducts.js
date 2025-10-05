// routes/setting/consignedProducts.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../../middleware/auth");

// ---------- helpers ----------
const toPosInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const toNonNeg = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

function parsePaging(q) {
  const pageSize = Math.min(Math.max(Number(q.pageSize) || 50, 1), 500);
  const page = Math.max(Number(q.page) || 1, 1);
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}

// ---------- GET: list with filters ----------
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page, pageSize, skip, take } = parsePaging(req.query);
    const where = {};

    // role-based scoping (ตัวอย่าง): จำกัดสิทธิ์ตาม user
    // - ถ้าเป็น owner/พนักงานร้านฝากขาย: เห็นเฉพาะ shopId ของตัวเอง
    // - ถ้าเป็นพนักงานสาขา: จะกรอง branchId เฉพาะสาขาตัวเอง (ตาม use-case)
    // ปรับตามระบบ auth ของคุณได้
    if (req.user?.role !== "admin") {
      if (req.user?.consignmentShopId) {
        where.shopId = req.user.consignmentShopId;
      }
      if (req.user?.branchId) {
        // ถ้าอยากจำกัดฝั่งสาขา: where.branchId = req.user.branchId;
      }
    }

    const qShop = toPosInt(req.query.shopId);
    if (qShop) where.shopId = qShop;

    const qBranch = toPosInt(req.query.branchId);
    if (qBranch) where.branchId = qBranch;

    const qProduct = toPosInt(req.query.productId);
    if (qProduct) where.productId = qProduct;

    const search = (req.query.search || "").trim();
    if (search) {
      // ค้นหาจากชื่อสินค้า/บาร์โค้ด (ผ่าน relation Product)
      where.OR = [
        { product: { name: { contains: search, mode: "insensitive" } } },
        { product: { barcode: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.consignedProduct.count({ where }),
      prisma.consignedProduct.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
        // ถ้าอยากให้ฝั่ง UI แสดงชื่อได้เลย สามารถ include ได้:
        include: {
          product: { select: { id: true, name: true, barcode: true } },
          branch: { select: { id: true, name: true } },
          shop: { select: { id: true, name: true } },
        },
      }),
    ]);

    // ส่งรูปแบบ { items, total, page, pageSize } (UI รองรับ)
    res.json({ items, total, page, pageSize });
  } catch (err) {
    console.error("❌ Load consigned products failed:", err);
    res.status(500).json({ error: "โหลดรายการล้มเหลว" });
  }
});

// ---------- GET: single ----------
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    const item = await prisma.consignedProduct.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, barcode: true } },
        branch: { select: { id: true, name: true } },
        shop: { select: { id: true, name: true } },
      },
    });

    if (!item) return res.status(404).json({ error: "ไม่พบรายการนี้" });
    res.json(item);
  } catch (err) {
    console.error("❌ Load consigned product failed:", err);
    res.status(500).json({ error: "โหลดข้อมูลล้มเหลว" });
  }
});

// ---------- POST: create ----------
router.post("/", authMiddleware, async (req, res) => {
  try {
    const shopId = toPosInt(req.body.shopId);
    const branchId = toPosInt(req.body.branchId);
    const productId = toPosInt(req.body.productId);
    const price = toNonNeg(req.body.price);
    const quantity = toNonNeg(req.body.quantity);

    if (!shopId || !branchId || !productId) {
      return res
        .status(400)
        .json({ error: "shopId/branchId/productId ต้อง > 0" });
    }

    // ตรวจสอบว่า FK มีจริง
    const [shop, branch, product] = await Promise.all([
      prisma.consignmentShop.findUnique({ where: { id: shopId } }),
      prisma.branch.findUnique({ where: { id: branchId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);
    if (!shop) return res.status(400).json({ error: "ไม่พบร้านฝากขาย" });
    if (!branch) return res.status(400).json({ error: "ไม่พบสาขา" });
    if (!product) return res.status(400).json({ error: "ไม่พบสินค้า" });

    // ป้องกันซ้ำ (แนะนำให้มี unique index ที่ schema: @@unique([shopId, branchId, productId]))
    const exists = await prisma.consignedProduct.findFirst({
      where: { shopId, branchId, productId },
      select: { id: true },
    });
    if (exists) {
      return res.status(400).json({
        error: "มีสินค้านี้สำหรับร้าน/สาขานี้อยู่แล้ว (shopId+branchId+productId ซ้ำ)",
      });
    }

    const created = await prisma.consignedProduct.create({
      data: { shopId, branchId, productId, price, quantity },
    });
    res.json(created);
  } catch (err) {
    console.error("❌ Create consigned product failed:", err);
    const msg = String(err || "");
    if (msg.includes("Unique constraint")) {
      return res
        .status(400)
        .json({ error: "ระบุสินค้าซ้ำ (shopId+branchId+productId ซ้ำ)" });
    }
    if (msg.includes("Foreign key constraint")) {
      return res.status(400).json({ error: "ข้อมูลอ้างอิงไม่ถูกต้อง" });
    }
    res.status(500).json({ error: "บันทึกรายการล้มเหลว" });
  }
});

// ---------- PUT: update ----------
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    // อนุญาตอัปเดต field หลักทั้งหมด (ถ้าไม่ต้องการ เปลี่ยนตามเหมาะสม)
    const data = {};
    if (req.body.shopId !== undefined) {
      const v = toPosInt(req.body.shopId);
      if (!v) return res.status(400).json({ error: "shopId ไม่ถูกต้อง" });
      data.shopId = v;
    }
    if (req.body.branchId !== undefined) {
      const v = toPosInt(req.body.branchId);
      if (!v) return res.status(400).json({ error: "branchId ไม่ถูกต้อง" });
      data.branchId = v;
    }
    if (req.body.productId !== undefined) {
      const v = toPosInt(req.body.productId);
      if (!v) return res.status(400).json({ error: "productId ไม่ถูกต้อง" });
      data.productId = v;
    }
    if (req.body.price !== undefined) {
      const v = toNonNeg(req.body.price);
      data.price = v;
    }
    if (req.body.quantity !== undefined) {
      const v = toNonNeg(req.body.quantity);
      data.quantity = v;
    }

    const updated = await prisma.consignedProduct.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (err) {
    console.error("❌ Update consigned product failed:", err);
    const msg = String(err || "");
    if (msg.includes("Unique constraint")) {
      return res
        .status(400)
        .json({ error: "ระบุสินค้าซ้ำ (shopId+branchId+productId ซ้ำ)" });
    }
    if (msg.includes("Foreign key constraint")) {
      return res.status(400).json({ error: "ข้อมูลอ้างอิงไม่ถูกต้อง" });
    }
    res.status(500).json({ error: "แก้ไขรายการล้มเหลว" });
  }
});

// ---------- DELETE ----------
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    await prisma.consignedProduct.delete({ where: { id } });
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    console.error("❌ Delete consigned product failed:", err);
    res.status(500).json({ error: "ลบรายการล้มเหลว" });
  }
});

module.exports = router;
