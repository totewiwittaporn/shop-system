// routes/setting/branches.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../../middleware/auth");
const checkRole = require("../../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

/**
 * 📋 RULES
 * - Admin: ดู/เพิ่ม/แก้ไข/ลบสาขาได้
 */

router.get("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        users: true,
        products: true,
      },
      orderBy: { id: "asc" },
    });
    res.json(branches);
  } catch (err) {
    console.error("❌ Get branches failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await prisma.branch.findUnique({
      where: { id: Number(id) },
      include: {
        users: true,
        products: true,
      },
    });

    if (!branch) {
      return res.status(404).json({ error: "ไม่พบสาขา" });
    }

    res.json(branch);
  } catch (err) {
    console.error("❌ Get branch failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, location } = req.body;
    const branch = await prisma.branch.create({
      data: { name, location },
    });
    res.json(branch);
  } catch (err) {
    console.error("❌ Create branch failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    const branch = await prisma.branch.update({
      where: { id: Number(id) },
      data: { name, location },
    });
    res.json(branch);
  } catch (err) {
    console.error("❌ Update branch failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.branch.delete({ where: { id: Number(id) } });
    res.json({ message: "ลบสาขาเรียบร้อย" });
  } catch (err) {
    console.error("❌ Delete branch failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
