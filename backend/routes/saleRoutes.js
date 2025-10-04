// routes/saleRoutes.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

// ✅ Create Sale + update stock (transaction) + check stock
router.post("/", authMiddleware, async (req, res) => {
  const { branchId, items } = req.body;
  // items = [{ productId, quantity, price }]

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. ตรวจสอบ stock
      for (const item of items) {
        const stock = await tx.stock.findUnique({
          where: {
            branchId_productId: {
              branchId,
              productId: item.productId,
            },
          },
        });

        if (!stock || stock.quantity < item.quantity) {
          throw new Error(
            `สินค้า productId=${item.productId} สต็อกไม่พอ (เหลือ ${
              stock ? stock.quantity : 0
            }, ต้องการ ${item.quantity})`
          );
        }
      }

      // 2. สร้าง Sale + Lines
      const sale = await tx.sale.create({
        data: {
          branchId,
          date: new Date(),
          status: "ACTIVE",
          lines: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { lines: true },
      });

      // 3. Update stock (decrement)
      for (const item of items) {
        await tx.stock.update({
          where: {
            branchId_productId: {
              branchId,
              productId: item.productId,
            },
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      return sale;
    });

    res.json(result);
  } catch (error) {
    console.error("❌ Sale transaction failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// 📋 GET: ดึงรายการขายทั้งหมด (option: filter branch/date)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { branchId, date } = req.query;

    const sales = await prisma.sale.findMany({
      where: {
        ...(branchId && { branchId: Number(branchId) }),
        ...(date && {
          date: {
            gte: new Date(date + "T00:00:00.000Z"),
            lte: new Date(date + "T23:59:59.999Z"),
          },
        }),
      },
      include: { lines: true },
      orderBy: { date: "desc" },
    });

    res.json(sales);
  } catch (error) {
    console.error("❌ Get sales failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🔎 GET: ดูรายละเอียดการขาย (by ID)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: Number(req.params.id) },
      include: { lines: true },
    });

    if (!sale) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการขาย" });
    }

    res.json(sale);
  } catch (error) {
    console.error("❌ Get sale failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🚫 CANCEL: ยกเลิกการขาย + คืน stock (แทน DELETE)
router.put("/:id/cancel", authMiddleware, async (req, res) => {
  const saleId = Number(req.params.id);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { lines: true },
      });

      if (!sale) throw new Error("ไม่พบข้อมูลการขาย");
      if (sale.status === "CANCELED")
        throw new Error("การขายนี้ถูกยกเลิกไปแล้ว");

      // คืน stock
      for (const line of sale.lines) {
        await tx.stock.update({
          where: {
            branchId_productId: {
              branchId: sale.branchId,
              productId: line.productId,
            },
          },
          data: {
            quantity: { increment: line.quantity },
          },
        });
      }

      // อัปเดตสถานะเป็น CANCELED
      const canceledSale = await tx.sale.update({
        where: { id: saleId },
        data: { status: "CANCELED" },
        include: { lines: true },
      });

      return canceledSale;
    });

    res.json({ message: "ยกเลิกการขายเรียบร้อย", sale: result });
  } catch (error) {
    console.error("❌ Cancel sale failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
