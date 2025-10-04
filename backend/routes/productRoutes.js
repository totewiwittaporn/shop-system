// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// 📋 GET: ดึงสินค้าทั้งหมด (option: filter by category)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { categoryId } = req.query;

    const products = await prisma.product.findMany({
      where: {
        ...(categoryId && { categoryId: Number(categoryId) }),
      },
      include: {
        category: true,
        stocks: { include: { branch: true } },
      },
      orderBy: { name: "asc" },
    });

    res.json(products);
  } catch (error) {
    console.error("❌ Get products failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🔎 GET: ดึงสินค้ารายตัว
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        category: true,
        stocks: { include: { branch: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "ไม่พบสินค้า" });
    }

    res.json(product);
  } catch (error) {
    console.error("❌ Get product failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ➕ POST: เพิ่มสินค้าใหม่ (Admin เท่านั้น)
router.post("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, categoryId, sku, barcode, price } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        categoryId,
        sku,
        barcode,
        price,
      },
    });

    res.json(product);
  } catch (error) {
    console.error("❌ Create product failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// ✏️ PUT: แก้ไขข้อมูลสินค้า (Admin เท่านั้น)
router.put("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, categoryId, sku, barcode, price } = req.body;

    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        categoryId,
        sku,
        barcode,
        price,
      },
    });

    res.json(product);
  } catch (error) {
    console.error("❌ Update product failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// 🗑️ DELETE: ลบสินค้า (Admin เท่านั้น)
router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: "ลบสินค้าเรียบร้อย" });
  } catch (error) {
    console.error("❌ Delete product failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
