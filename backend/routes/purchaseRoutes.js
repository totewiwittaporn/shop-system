const express = require("express");
const router = express.Router();
const { PrismaClient, StockLocation } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// CREATE purchase
router.post("/", async (req, res) => {
  try {
    const { supplierId, branchId, items } = req.body;

    const purchase = await prisma.$transaction(async (tx) => {
      // สร้าง Purchase และ PurchaseLines
      const newPurchase = await tx.purchase.create({
        data: {
          supplierId,
          branchId,
          date: new Date(),
          lines: {
            create: items.map((it) => ({
              productId: it.productId,
              orderedQty: it.orderedQty,
              receivedQty: it.receivedQty,
              usableQty: it.usableQty,
              defectQty: it.defectQty || 0,
              unitCost: it.unitCost,
              totalCost: it.totalCost,
              stockLocation: it.stockLocation || StockLocation.MAIN,
            })),
          },
        },
        include: { lines: true },
      });

      // อัปเดต Stock ตาม StockLocation
      for (const line of newPurchase.lines) {
        let branchProduct = await tx.branchProduct.findFirst({
          where: { productId: line.productId, branchId },
        });

        if (!branchProduct) {
          branchProduct = await tx.branchProduct.create({
            data: { productId: line.productId, branchId, price: line.unitCost, stock: 0 },
          });
        }

        await tx.stock.upsert({
          where: {
            branchProductId_stockLocation: {
              branchProductId: branchProduct.id,
              stockLocation: line.stockLocation,
            },
          },
          update: { quantity: { increment: line.usableQty } },
          create: {
            branchProductId: branchProduct.id,
            branchId,
            stockLocation: line.stockLocation,
            quantity: line.usableQty,
          },
        });
      }

      return newPurchase;
    });

    res.json(purchase);
  } catch (err) {
    console.error("❌ Purchase creation failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all purchases
router.get("/", async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        branch: true,
        lines: true,
      },
      orderBy: { date: "desc" },
    });
    res.json(purchases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

module.exports = router;
