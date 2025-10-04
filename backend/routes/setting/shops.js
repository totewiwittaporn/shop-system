const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../../middleware/auth");
const checkRole = require("../../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

// ✅ GET: ดึงร้านฝากขายทั้งหมด
router.get("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const shops = await prisma.consignmentShop.findMany({
      orderBy: { name: "asc" },
    });
    res.json(shops);
  } catch (err) {
    console.error("❌ Get shops failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ➕ POST: เพิ่มร้านฝากขาย
router.post("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, contact, phone, email, address, taxId } = req.body;
    const shop = await prisma.consignmentShop.create({
      data: { name, contact, phone, email, address, taxId },
    });
    res.json(shop);
  } catch (err) {
    console.error("❌ Create shop failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ✏️ PUT: แก้ไขร้านฝากขาย
router.put("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, phone, email, address, taxId } = req.body;
    const shop = await prisma.consignmentShop.update({
      where: { id: Number(id) },
      data: { name, contact, phone, email, address, taxId },
    });
    res.json(shop);
  } catch (err) {
    console.error("❌ Update shop failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// 🗑️ DELETE: ลบร้านฝากขาย
router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.consignmentShop.delete({ where: { id: Number(id) } });
    res.json({ message: "ลบร้านเรียบร้อย" });
  } catch (err) {
    console.error("❌ Delete shop failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
