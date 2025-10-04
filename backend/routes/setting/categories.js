const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../../middleware/auth");
const checkRole = require("../../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

// ✅ GET: ดึงหมวดหมู่ทั้งหมด
router.get("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    console.error("❌ Get categories failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ➕ POST: เพิ่มหมวดหมู่ใหม่
router.post("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { name } = req.body;
    const category = await prisma.category.create({ data: { name } });
    res.json(category);
  } catch (err) {
    console.error("❌ Create category failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ✏️ PUT: แก้ไขหมวดหมู่
router.put("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { name },
    });
    res.json(category);
  } catch (err) {
    console.error("❌ Update category failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// 🗑️ DELETE: ลบหมวดหมู่
router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id: Number(id) } });
    res.json({ message: "ลบหมวดหมู่เรียบร้อย" });
  } catch (err) {
    console.error("❌ Delete category failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
