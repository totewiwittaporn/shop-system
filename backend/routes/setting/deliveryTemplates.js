// routes/settings/delivery-templates.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../../middleware/auth");

// GET: ดึงทุก Template
router.get("/", authMiddleware, async (req, res) => {
  try {
    const templates = await prisma.deliveryTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(templates);
  } catch (err) {
    console.error("❌ Load templates failed:", err);
    res.status(500).json({ error: "โหลด templates ล้มเหลว" });
  }
});

// POST: สร้าง Template ใหม่
router.post("/", authMiddleware, async (req, res) => {
  const { branchId, name, config } = req.body;
  if (!branchId || !name) {
    return res.status(400).json({ error: "Branch และ Name ต้องไม่ว่าง" });
  }

  try {
    const template = await prisma.deliveryTemplate.create({
      data: {
        branchId,
        name,
        config: config || {},
      },
    });
    res.json(template);
  } catch (err) {
    console.error("❌ Create template failed:", err);
    res.status(500).json({ error: "สร้าง template ล้มเหลว" });
  }
});

// PUT: แก้ไข Template
router.put("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { name, config } = req.body;

  try {
    const template = await prisma.deliveryTemplate.update({
      where: { id },
      data: { name, config },
    });
    res.json(template);
  } catch (err) {
    console.error("❌ Update template failed:", err);
    res.status(500).json({ error: "แก้ไข template ล้มเหลว" });
  }
});

// DELETE: ลบ Template
router.delete("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);

  try {
    await prisma.deliveryTemplate.delete({ where: { id } });
    res.json({ message: "ลบ template สำเร็จ" });
  } catch (err) {
    console.error("❌ Delete template failed:", err);
    res.status(500).json({ error: "ลบ template ล้มเหลว" });
  }
});

module.exports = router;
