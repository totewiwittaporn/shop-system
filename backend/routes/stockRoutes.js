// backend/routes/stockRoutes.js
const express = require("express");
const { PrismaClient, StockLocation } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();

/* ---------------- Helpers ---------------- */
const toPosInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// map ค่าจาก UI/พารามิเตอร์ให้สอดคล้อง enum ใน DB
function normalizeLocation(input) {
  if (!input) return null;
  const s = String(input).toUpperCase();
  // รองรับ alias จาก UI
  if (s === "NORMAL") return "MAIN";
  if (s === "CONSIGNMENT") return "CONSIGN";
  if (["MAIN", "BRANCH", "CONSIGN"].includes(s)) return s;
  return null;
}

/* ---------------- GET all stocks (with filters) ---------------- */
router.get(
  "/",
  authMiddleware,
  checkRole(["admin", "staff", "customer"]),
  async (req, res) => {
    try {
      const where = {};

      // จำกัดสิทธิ์: ไม่ใช่ admin เห็นเฉพาะสาขาตนเอง
      if (req.user?.role !== "admin" && req.user?.branchId) {
        where.branchId = Number(req.user.branchId);
      }

      // ตัวกรองจาก query
      const qBranchId = toPosInt(req.query.branchId);
      const qProductId = toPosInt(req.query.productId);
      const qLoc =
        normalizeLocation(req.query.location) ||
        normalizeLocation(req.query.stockLocation) ||
        normalizeLocation(req.query.deliveryStockType);

      if (qBranchId) where.branchId = qBranchId;
      if (qProductId) where.productId = qProductId;
      if (qLoc) where.StockLocation = qLoc; // ✅ ใช้ชื่อฟิลด์ใน schema (S ใหญ่)

      const take = Math.min(toPosInt(req.query.pageSize) || 500, 1000);

      // ✅ ไม่ include product ที่ระดับ Stock (ไม่มีความสัมพันธ์ชื่อนั้น)
      //    ให้ดึงผ่าน branchProduct -> product แทน
      const stocks = await prisma.stock.findMany({
        where,
        include: {
          branch: true,
          branchProduct: {
            include: {
              product: true, // ← ดึงรายละเอียดสินค้าผ่านความสัมพันธ์ของ branchProduct
            },
          },
        },
        orderBy: [{ branchId: "asc" }, { productId: "asc" }],
        take,
      });

      res.json(stocks);
    } catch (err) {
      console.error("❌ load stocks failed:", err);
      res.status(500).json({ error: err.message || "โหลดสต็อกล้มเหลว" });
    }
  }
);

/* ---------------- POST add stock ---------------- */
router.post(
  "/",
  authMiddleware,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { branchId, productId, quantity, stockLocation } = req.body;

      const loc =
        normalizeLocation(stockLocation) || StockLocation.MAIN; // MAIN/BRANCH/CONSIGN

      const stock = await prisma.stock.create({
        data: {
          branchId: toPosInt(branchId),
          productId: toPosInt(productId),
          quantity: toPosInt(quantity),
          StockLocation: loc, // ✅ ชื่อฟิลด์ถูกต้อง
        },
      });

      res.json(stock);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message });
    }
  }
);

/* ---------------- PUT update stock ---------------- */
router.put(
  "/:branchId/:productId/:stockLocation",
  authMiddleware,
  checkRole(["admin", "staff"]),
  async (req, res) => {
    try {
      const { branchId, productId, stockLocation } = req.params;
      const { quantity } = req.body;

      if (req.user.role !== "admin" && req.user.branchId !== Number(branchId)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const loc = normalizeLocation(stockLocation);
      if (!loc) return res.status(400).json({ error: "stockLocation ไม่ถูกต้อง" });

      const stock = await prisma.stock.update({
        where: {
          // ✅ compound key ต้องใช้ชื่อฟิลด์ที่ตรง schema
          branchId_productId_StockLocation: {
            branchId: Number(branchId),
            productId: Number(productId),
            StockLocation: loc,
          },
        },
        data: { quantity: toPosInt(quantity) },
      });

      res.json(stock);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message });
    }
  }
);

/* ---------------- DELETE stock ---------------- */
router.delete(
  "/:branchId/:productId/:stockLocation",
  authMiddleware,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { branchId, productId, stockLocation } = req.params;

      const loc = normalizeLocation(stockLocation);
      if (!loc) return res.status(400).json({ error: "stockLocation ไม่ถูกต้อง" });

      await prisma.stock.delete({
        where: {
          branchId_productId_StockLocation: {
            branchId: Number(branchId),
            productId: Number(productId),
            StockLocation: loc,
          },
        },
      });

      res.json({ message: "Deleted stock successfully" });
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message });
    }
  }
);

module.exports = router;
