const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

// GET: ดึงรายการ DeliveryDoc ทั้งหมด
router.get("/", authMiddleware, async (req, res) => {
  try {
    const deliveries = await prisma.deliveryDoc.findMany({
      include: { lines: true, transfer: true, template: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(deliveries);
  } catch (err) {
    console.error("❌ Load deliveries failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST: สร้าง DeliveryDoc
router.post("/", authMiddleware, async (req, res) => {
  const { transferId, templateId, lines } = req.body;

  if (!transferId || !lines || !lines.length) {
    return res.status(400).json({ error: "Transfer และรายการสินค้าต้องมีค่า" });
  }

  try {
    const delivery = await prisma.deliveryDoc.create({
      data: {
        transferId,
        templateId: templateId || null,
        lines: {
          create: lines.map((l) => ({
            description: l.description || null,
            sku: l.sku || null,
            productName: l.productName || null,
            quantity: l.quantity || null,
            unitPrice: l.unitPrice || null,
            amount: l.amount || null,
          })),
        },
      },
      include: { lines: true, transfer: true, template: true },
    });

    res.json(delivery);
  } catch (err) {
    console.error("❌ Create delivery failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT: อัปเดตสถานะ (ถ้าอยากเก็บ status ใน DeliveryDoc ต้องเพิ่มฟิลด์ status ก่อน)
router.put("/:id/status", authMiddleware, async (req, res) => {
  const deliveryId = Number(req.params.id);
  const { status } = req.body;

  const validStatus = ["PENDING", "SHIPPED", "RECEIVED", "CANCELED"];
  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
  }

  try {
    const updated = await prisma.deliveryDoc.update({
      where: { id: deliveryId },
      data: { status }, // ⚠️ ต้องเพิ่มฟิลด์ status ลงใน DeliveryDoc ก่อน
    });
    res.json(updated);
  } catch (err) {
    console.error("❌ Update delivery status failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
