const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

/**
 * ✅ ดึงรายชื่อผู้ใช้ทั้งหมด (เฉพาะ admin)
 * GET /api/users
 */
router.get("/", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branch: { select: { id: true, name: true } },
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" });
  }
});

/**
 * ✅ ดึงข้อมูลผู้ใช้ทีละคน (เฉพาะ admin)
 * GET /api/users/:id
 */
router.get("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branch: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    res.json(user);
  } catch (error) {
    console.error("Fetch user error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" });
  }
});

/**
 * ✅ แก้ไขข้อมูลผู้ใช้ (เฉพาะ admin)
 * PUT /api/users/:id
 */
router.put("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  const { id } = req.params;
  const { name, email, role, branchId } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        name,
        email,
        role,
        branchId: branchId ? Number(branchId) : null,
      },
    });

    res.json({ message: "แก้ไขข้อมูลผู้ใช้สำเร็จ", user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้" });
  }
});

/**
 * ✅ Reset password (เฉพาะ admin)
 * PUT /api/users/:id/reset-password
 */
router.put(
  "/:id/reset-password",
  authMiddleware,
  checkRole(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password ต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data: { passwordHash: hashedPassword },
      });

      res.json({ message: "รีเซ็ตรหัสผ่านสำเร็จ", userId: updatedUser.id });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "เกิดข้อผิดพลาด" });
    }
  }
);

/**
 * ✅ ลบผู้ใช้ (เฉพาะ admin)
 * DELETE /api/users/:id
 */
router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.User.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบผู้ใช้สำเร็จ" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบผู้ใช้" });
  }
});

module.exports = router;
