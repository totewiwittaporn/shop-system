const express = require("express");
const { PrismaClient, StockLocation } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

// GET all stocks
router.get("/", authMiddleware, checkRole(["admin", "staff", "customer"]), async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role !== "admin") whereClause.branchId = req.user.branchId;

    const stocks = await prisma.stock.findMany({
      where: whereClause,
      include: {
        branch: true,
        branchProduct: {
          include: { product: true },
        },
      },
      orderBy: { branchId: "asc" },
    });

    res.json(stocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST add stock
router.post("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { branchId, productId, quantity, stockLocation } = req.body;

    const stock = await prisma.stock.create({
      data: {
        branchId,
        productId,
        quantity,
        stockLocation: stockLocation || StockLocation.MAIN,
      },
    });

    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// PUT update stock
router.put("/:branchId/:productId/:stockLocation", authMiddleware, checkRole(["admin", "staff"]), async (req, res) => {
  try {
    const { branchId, productId, stockLocation } = req.params;
    const { quantity } = req.body;

    if (req.user.role !== "admin" && req.user.branchId !== Number(branchId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const stock = await prisma.stock.update({
      where: {
        branchId_productId_stockLocation: {
          branchId: Number(branchId),
          productId: Number(productId),
          stockLocation,
        },
      },
      data: { quantity },
    });

    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE stock
router.delete("/:branchId/:productId/:stockLocation", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { branchId, productId, stockLocation } = req.params;

    await prisma.stock.delete({
      where: {
        branchId_productId_stockLocation: {
          branchId: Number(branchId),
          productId: Number(productId),
          stockLocation,
        },
      },
    });

    res.json({ message: "Deleted stock successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
