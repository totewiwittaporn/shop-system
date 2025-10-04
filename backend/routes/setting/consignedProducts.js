const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../../middleware/auth");
const checkRole = require("../../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

// ✅ GET: ดึงสินค้าฝากขาย
router.get("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const consigned = await prisma.consignedProduct.findMany({
      include: { product: true, shop: true, branch: true },
      orderBy: { id: "asc" },
    });
    res.json(consigned);
  } catch (err) {
    console.error("❌ Get consigned products failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ➕ POST: เพิ่มสินค้าฝากขาย
router.post("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { productId, shopId, branchId, price, quantity } = req.body;
    const consigned = await prisma.consignedProduct.create({
      data: { productId, shopId, branchId, price, quantity },
    });
    res.json(consigned);
  } catch (err) {
    console.error("❌ Create consigned product failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ✏️ PUT: แก้ไขสินค้าฝากขาย
router.put("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, shopId, branchId, price, quantity } = req.body;
    const consigned = await prisma.consignedProduct.update({
      where: { id: Number(id) },
      data: { productId, shopId, branchId, price, quantity },
    });
    res.json(consigned);
  } catch (err) {
    console.error("❌ Update consigned product failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// 🗑️ DELETE: ลบสินค้าฝากขาย
router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.consignedProduct.delete({ where: { id: Number(id) } });
    res.json({ message: "ลบสินค้าฝากขายเรียบร้อย" });
  } catch (err) {
    console.error("❌ Delete consigned product failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
