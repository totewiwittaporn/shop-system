const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const prisma = new PrismaClient();
const router = express.Router();


// ✅ Admin: ดูรายชื่อ user ทั้งหมด
router.get("/users", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        branchId: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// ✅ Admin: อัปเดต role + branch ของ user
router.put("/users/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, branchId } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        role: role || undefined,
        branchId: branchId || null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        branchId: true,
        createdAt: true,
      },
    });

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
