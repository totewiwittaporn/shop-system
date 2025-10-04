
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");

const prisma = new PrismaClient();
const router = express.Router();

// ✅ Register (email + password + branchId)
router.post("/register", async (req, res) => {
  try {
    const { email, password, branchId } = req.body;

    if (!email || !password || !branchId) {
      return res.status(400).json({ error: "Email, password, and branch are required" });
    }

    // เช็คว่ามี user นี้แล้วหรือยัง
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // เช็คว่า branchId มีจริงหรือเปล่า
    const branch = await prisma.branch.findUnique({ where: { id: Number(branchId) } });
    if (!branch) {
      return res.status(400).json({ error: "Invalid branch" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // role เริ่มต้นเป็น "user" เสมอ
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "user",
        branchId: Number(branchId),
      },
    });

    res.status(201).json({ message: "User registered", userId: user.id });
  } catch (err) {
    console.error("❌ Register failed:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// ✅ LOGIN
// ล็อกอินด้วย email + password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // หาว่ามี user นี้มั้ย
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ตรวจสอบ password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // สร้าง JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },   // payload
      process.env.JWT_SECRET,             // key (เก็บใน .env)
      { expiresIn: "1d" }                 // อายุ token
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }, // req.user ถูก set มาจาก authMiddleware
      select: {
        id: true,
        email: true,
        role: true,
        branchId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ authenticated: false, error: "Unauthorized" });
    }

    res.json({ authenticated: true, user });
  } catch (err) {
    console.error("❌ Get /me error:", err.message);
    res.status(500).json({ authenticated: false, error: "Something went wrong" });
  }
});

module.exports = router;
