// routes/consignmentRoutes.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

//
// 🏪 Consignment Shops (ร้านคู่ค้า)
//

// 📋 GET: ดึงร้านคู่ค้าทั้งหมด
router.get("/shops", authMiddleware, async (req, res) => {
  try {
    const shops = await prisma.consignmentShop.findMany({
      orderBy: { name: "asc" },
    });
    res.json(shops);
  } catch (error) {
    console.error("❌ Get consignment shops failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🔎 GET: ดึงร้านคู่ค้ารายตัว
router.get("/shops/:id", authMiddleware, async (req, res) => {
  try {
    const shop = await prisma.consignmentShop.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!shop) return res.status(404).json({ error: "ไม่พบร้านคู่ค้า" });
    res.json(shop);
  } catch (error) {
    console.error("❌ Get consignment shop failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ➕ POST: เพิ่มร้านคู่ค้า (Admin เท่านั้น)
router.post("/shops", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, display, contact } = req.body;

    const shop = await prisma.consignmentShop.create({
      data: { name, display, contact },
    });

    res.json(shop);
  } catch (error) {
    console.error("❌ Create consignment shop failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// ✏️ PUT: อัปเดตร้านคู่ค้า (Admin เท่านั้น)
router.put("/shops/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, display, contact } = req.body;

    const shop = await prisma.consignmentShop.update({
      where: { id: Number(req.params.id) },
      data: { name, display, contact },
    });

    res.json(shop);
  } catch (error) {
    console.error("❌ Update consignment shop failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// 🗑️ DELETE: ลบร้านคู่ค้า (Admin เท่านั้น)
router.delete("/shops/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    await prisma.consignmentShop.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ message: "ลบร้านคู่ค้าเรียบร้อย" });
  } catch (error) {
    console.error("❌ Delete consignment shop failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

//
// 📦 Consignments (ฝากขายสินค้า)
//

// 📋 GET: ดึงรายการฝากขายทั้งหมด
router.get("/", authMiddleware, async (req, res) => {
  try {
    const consignments = await prisma.consignment.findMany({
      include: {
        shop: true,
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(consignments);
  } catch (error) {
    console.error("❌ Get consignments failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🔎 GET: ดึงรายการฝากขายรายตัว
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const consignment = await prisma.consignment.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        shop: true,
        product: true,
      },
    });

    if (!consignment) return res.status(404).json({ error: "ไม่พบข้อมูลฝากขาย" });
    res.json(consignment);
  } catch (error) {
    console.error("❌ Get consignment failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ➕ POST: เพิ่มรายการฝากขาย
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { shopId, productId, price, quantity } = req.body;

    const consignment = await prisma.consignment.create({
      data: {
        shopId,
        productId,
        price,
        quantity,
        createdAt: new Date(),
      },
      include: { shop: true, product: true },
    });

    res.json(consignment);
  } catch (error) {
    console.error("❌ Create consignment failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// ✏️ PUT: อัปเดตรายการฝากขาย
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { price, quantity } = req.body;

    const consignment = await prisma.consignment.update({
      where: { id: Number(req.params.id) },
      data: { price, quantity },
      include: { shop: true, product: true },
    });

    res.json(consignment);
  } catch (error) {
    console.error("❌ Update consignment failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// 🗑️ DELETE: ลบรายการฝากขาย
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await prisma.consignment.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ message: "ลบรายการฝากขายเรียบร้อย" });
  } catch (error) {
    console.error("❌ Delete consignment failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
