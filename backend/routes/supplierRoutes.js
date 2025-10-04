const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// GET all suppliers
router.get("/", async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      select: { id: true, name: true }
    });
    res.json(suppliers);
  } catch (err) {
    console.error("Get suppliers failed:", err);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

module.exports = router;
