// routes/branchRoutes.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// 📋 GET: ดึงสาขาทั้งหมด (รวม users)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      include: { users: true },
      orderBy: { name: "asc" },
    });
    res.json(branches);
  } catch (error) {
    console.error("❌ Get branches failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET all branches
router.get("/", async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      select: { id: true, name: true }
    });
    res.json(branches);
  } catch (err) {
    console.error("Get branches failed:", err);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

// 📋 GET: ใช้สำหรับ dropdown (เบากว่า, ไม่มี users)
router.get("/dropdown", authMiddleware, async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    res.json(branches);
  } catch (error) {
    console.error("❌ Get branch dropdown failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ➕ POST: เพิ่มสาขาใหม่ (Admin เท่านั้น)
router.post("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    const branch = await prisma.branch.create({
      data: { name, address, phone },
    });
    res.json(branch);
  } catch (error) {
    console.error("❌ Create branch failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// ✏️ PUT: แก้ไขข้อมูลสาขา (Admin เท่านั้น)
router.put("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    const branch = await prisma.branch.update({
      where: { id: Number(req.params.id) },
      data: { name, address, phone },
    });
    res.json(branch);
  } catch (error) {
    console.error("❌ Update branch failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// 🗑️ DELETE: ลบสาขา (Admin เท่านั้น)
router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    await prisma.branch.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "ลบสาขาเรียบร้อย" });
  } catch (error) {
    console.error("❌ Delete branch failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
