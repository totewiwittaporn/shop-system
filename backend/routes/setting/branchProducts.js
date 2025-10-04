const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../../middleware/auth");
const checkRole = require("../../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

// ✅ GET: สินค้าของแต่ละสาขา
router.get("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const products = await prisma.branchProduct.findMany({
      include: { branch: true, product: true },
      orderBy: { id: "asc" },
    });
    res.json(products);
  } catch (err) {
    console.error("❌ Get branch products failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ➕ POST: เพิ่มสินค้าสาขา
router.post("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { branchId, productId, sku, name, price, stock } = req.body;
    const branchProduct = await prisma.branchProduct.create({
      data: { branchId, productId, sku, name, price, stock },
    });
    res.json(branchProduct);
  } catch (err) {
    console.error("❌ Create branch product failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ✏️ PUT: แก้ไขสินค้าสาขา
router.put("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name, price, stock } = req.body;
    const branchProduct = await prisma.branchProduct.update({
      where: { id: Number(id) },
      data: { sku, name, price, stock },
    });
    res.json(branchProduct);
  } catch (err) {
    console.error("❌ Update branch product failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// 🗑️ DELETE: ลบสินค้าสาขา
router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.branchProduct.delete({ where: { id: Number(id) } });
    res.json({ message: "ลบสินค้าสาขาเรียบร้อย" });
  } catch (err) {
    console.error("❌ Delete branch product failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
