// routes/setting/products.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../../middleware/auth");
const checkRole = require("../../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

/**
 * 📋 RULES
 * - Admin: ดู/เพิ่ม/แก้ไข/ลบสินค้าได้
 * - Staff / Customer: ไม่มีสิทธิ์ใน settings
 */

// 📋 GET: ดึงรายการสินค้าทั้งหมด
router.get("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        branchProducts: true,
      },
      orderBy: { id: "asc" },
    });
    res.json(products);
  } catch (err) {
    console.error("❌ Get products failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔎 GET: ดึงข้อมูลสินค้าตาม id
router.get("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        branchProducts: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "ไม่พบสินค้า" });
    }

    res.json(product);
  } catch (err) {
    console.error("❌ Get product failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ➕ POST: เพิ่มสินค้าใหม่
router.post("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, description, categoryId, barcode } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        categoryId,
        barcode,
      },
    });

    res.json(product);
  } catch (err) {
    console.error("❌ Create product failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ✏️ PUT: แก้ไขสินค้า
router.put("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, barcode } = req.body;

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        categoryId,
        barcode,
      },
    });

    res.json(product);
  } catch (err) {
    console.error("❌ Update product failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// 🗑️ DELETE: ลบสินค้า
router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบสินค้าเรียบร้อย" });
  } catch (err) {
    console.error("❌ Delete product failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
