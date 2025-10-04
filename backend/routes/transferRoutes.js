// routes/transferRoutes.js
const express = require("express");
const router = express.Router();
const { PrismaClient, TransferStatus } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

// 🚚 POST: สร้าง Transfer (โอนสินค้าระหว่างสาขา)
router.post("/", authMiddleware, async (req, res) => {
  const { fromBranchId, toBranchId, items } = req.body;
  // items = [{ productId, quantity }]

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. ตรวจสอบ stock ต้นทาง
      for (const item of items) {
        const stock = await tx.stock.findUnique({
          where: {
            branchId_productId: {
              branchId: fromBranchId,
              productId: item.productId,
            },
          },
        });
        if (!stock || stock.quantity < item.quantity) {
          throw new Error(
            `สต็อกไม่พอ productId=${item.productId}, เหลือ ${
              stock ? stock.quantity : 0
            }, ต้องการ ${item.quantity}`
          );
        }
      }

      // 2. สร้าง Transfer
      const transfer = await tx.transfer.create({
        data: {
          fromBranchId,
          toBranchId,
          status: "PENDING",
          createdAt: new Date(),
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // 3. ตัด stock ต้นทาง
      for (const item of items) {
        await tx.stock.update({
          where: {
            branchId_productId: {
              branchId: fromBranchId,
              productId: item.productId,
            },
          },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      return transfer;
    });

    res.json(result);
  } catch (error) {
    console.error("❌ Transfer create failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// 📋 GET: ดึง Transfers ทั้งหมด
router.get("/", authMiddleware, async (req, res) => {
  try {
    const transfers = await prisma.transfer.findMany({
      include: {
        fromBranch: true,
        toBranch: true,
        items: { include: { product: true } },
        deliveryDocs: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(transfers);
  } catch (error) {
    console.error("❌ Get transfers failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🔎 GET: ดึง Transfer รายตัว
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        fromBranch: true,
        toBranch: true,
        items: { include: { product: true } },
        deliveryDocs: true,
      },
    });

    if (!transfer) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการโอนสินค้า" });
    }

    res.json(transfer);
  } catch (error) {
    console.error("❌ Get transfer failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✏️ PUT: อัปเดตสถานะ Transfer (PENDING → SHIPPED → RECEIVED → CANCELED)
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!Object.values(TransferStatus).includes(status)) {
      return res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
    }

    const transfer = await prisma.transfer.update({
      where: { id: Number(req.params.id) },
      data: { status },
      include: { items: true },
    });

    // ถ้า status = RECEIVED → เพิ่ม stock ปลายทาง
    if (status === "RECEIVED") {
      await prisma.$transaction(async (tx) => {
        for (const item of transfer.items) {
          await tx.stock.upsert({
            where: {
              branchId_productId: {
                branchId: transfer.toBranchId,
                productId: item.productId,
              },
            },
            update: { quantity: { increment: item.quantity } },
            create: {
              branchId: transfer.toBranchId,
              productId: item.productId,
              quantity: item.quantity,
            },
          });
        }
      });
    }

    res.json({ message: "อัปเดตสถานะสำเร็จ", transfer });
  } catch (error) {
    console.error("❌ Update transfer status failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
