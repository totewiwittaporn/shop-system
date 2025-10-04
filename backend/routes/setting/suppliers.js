// routes/setting/suppliers.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../../middleware/auth");
const checkRole = require("../../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

/**
 * 📋 RULES
 * - Admin: ดู/เพิ่ม/แก้ไข/ลบ Supplier ได้
 */

router.get("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { id: "asc" },
    });
    res.json(suppliers);
  } catch (err) {
    console.error("❌ Get suppliers failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(id) },
    });

    if (!supplier) {
      return res.status(404).json({ error: "ไม่พบ Supplier" });
    }

    res.json(supplier);
  } catch (err) {
    console.error("❌ Get supplier failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, contact, phone, email, address } = req.body;
    const supplier = await prisma.supplier.create({
      data: { name, contact, phone, email, address },
    });
    res.json(supplier);
  } catch (err) {
    console.error("❌ Create supplier failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, phone, email, address } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: Number(id) },
      data: { name, contact, phone, email, address },
    });
    res.json(supplier);
  } catch (err) {
    console.error("❌ Update supplier failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.supplier.delete({ where: { id: Number(id) } });
    res.json({ message: "ลบ Supplier เรียบร้อย" });
  } catch (err) {
    console.error("❌ Delete supplier failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
