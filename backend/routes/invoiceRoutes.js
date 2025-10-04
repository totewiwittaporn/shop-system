// routes/invoiceRoutes.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

// 🧾 POST: สร้าง Invoice จาก Sale
router.post("/", authMiddleware, async (req, res) => {
  const { saleId, templateId, note } = req.body;

  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { lines: { include: { product: true } } },
    });

    if (!sale) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการขาย" });
    }

    const invoice = await prisma.invoice.create({
      data: {
        saleId,
        templateId,
        note,
        createdAt: new Date(),
        lines: {
          create: sale.lines.map((line) => ({
            description: line.product.name,
            quantity: line.quantity,
            price: line.price,
          })),
        },
      },
      include: { lines: true, template: true, sale: true },
    });

    res.json(invoice);
  } catch (error) {
    console.error("❌ Create invoice failed:", error.message);
    res.status(500).json({ error: "สร้างใบแจ้งหนี้ล้มเหลว" });
  }
});

// 📋 GET: ดึง Invoices ทั้งหมด
router.get("/", authMiddleware, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        lines: true,
        sale: { include: { branch: true } },
        template: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(invoices);
  } catch (error) {
    console.error("❌ Get invoices failed:", error.message);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูล Invoices ได้" });
  }
});

// 🔎 GET: ดึง Invoice รายตัว
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        lines: true,
        sale: { include: { branch: true, lines: { include: { product: true } } } },
        template: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "ไม่พบ Invoice" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("❌ Get invoice failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✏️ PUT: อัปเดต Invoice (แก้ไข note, template, lines)
router.put("/:id", authMiddleware, async (req, res) => {
  const { note, templateId, lines } = req.body;

  try {
    const updatedInvoice = await prisma.invoice.update({
      where: { id: Number(req.params.id) },
      data: {
        note,
        templateId,
        updatedAt: new Date(),
        ...(lines && {
          lines: {
            deleteMany: {}, // ลบ lines เก่า
            create: lines.map((line) => ({
              description: line.description,
              quantity: line.quantity,
              price: line.price,
            })),
          },
        }),
      },
      include: { lines: true, template: true },
    });

    res.json(updatedInvoice);
  } catch (error) {
    console.error("❌ Update invoice failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
