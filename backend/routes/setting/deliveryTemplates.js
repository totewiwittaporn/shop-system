// routes/setting/deliveryTemplates.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../../middleware/auth");

// ---------- Utils ----------
function toPosInt(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const ALLOWED_SCOPES = new Set(["GLOBAL", "BRANCH_SHARED", "CONSIGNMENT"]);

/** เก็บเฉพาะคีย์ของ layout/policy ของเทมเพลต (ไม่เก็บ lines สินค้า) */
function pruneConfig(cfg) {
  const c = cfg && typeof cfg === "object" ? cfg : {};
  const out = {};
  if (c.patternKey != null) out.patternKey = String(c.patternKey);
  if (c.headerNote != null) out.headerNote = String(c.headerNote);
  if (c.footerNote != null) out.footerNote = String(c.footerNote);
  if (c.columns != null) out.columns = c.columns;
  if (c.numbering != null) out.numbering = c.numbering;
  // ❌ ห้ามแนบ lines จริงไว้ในเทมเพลต
  return out;
}

// ---------- GET: list ----------
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { scope, branchId, consignmentShopId, search } = req.query;

    const where = {};
    if (scope) where.scope = String(scope); // GLOBAL | BRANCH_SHARED | CONSIGNMENT
    if (branchId) {
      const b = toPosInt(branchId);
      if (b) where.branchId = b;
    }
    if (consignmentShopId) {
      const s = toPosInt(consignmentShopId);
      if (s) where.consignmentShopId = s;
    }
    if (search) where.name = { contains: String(search), mode: "insensitive" };

    const templates = await prisma.deliveryTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
    res.json(templates);
  } catch (err) {
    console.error("❌ Load templates failed:", err);
    res.status(500).json({ error: "โหลด templates ล้มเหลว" });
  }
});

// ---------- GET: one ----------
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    const template = await prisma.deliveryTemplate.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ error: "ไม่พบ template นี้" });

    res.json(template);
  } catch (err) {
    console.error("❌ Load template failed:", err);
    res.status(500).json({ error: "โหลด template ล้มเหลว" });
  }
});

// ---------- POST: create (ไม่มี lines ใน config) ----------
router.post("/", authMiddleware, async (req, res) => {
  try {
    const scopeRaw = String(req.body.scope || "GLOBAL").toUpperCase();
    const scope = ALLOWED_SCOPES.has(scopeRaw) ? scopeRaw : "GLOBAL";
    const name = (req.body.name || "").trim();

    const branchId =
      req.body.branchId !== undefined && req.body.branchId !== null
        ? toPosInt(req.body.branchId)
        : null;

    const consignmentShopId =
      req.body.consignmentShopId !== undefined && req.body.consignmentShopId !== null
        ? toPosInt(req.body.consignmentShopId)
        : null;

    const cfg = pruneConfig(req.body.config);

    if (!name) return res.status(400).json({ error: "name ต้องไม่ว่าง" });
    if (scope === "BRANCH_SHARED" && !branchId) {
      return res.status(400).json({ error: "branchId จำเป็นเมื่อ scope=BRANCH_SHARED" });
    }
    if (scope === "CONSIGNMENT" && !consignmentShopId) {
      return res.status(400).json({ error: "consignmentShopId จำเป็นเมื่อ scope=CONSIGNMENT" });
    }
    if (scope === "GLOBAL" && (branchId || consignmentShopId)) {
      return res.status(400).json({ error: "GLOBAL ห้ามระบุ branchId/consignmentShopId" });
    }

    const created = await prisma.deliveryTemplate.create({
      data: {
        scope,
        branchId: scope === "BRANCH_SHARED" ? branchId : null,
        consignmentShopId: scope === "CONSIGNMENT" ? consignmentShopId : null,
        name,
        config: cfg, // ✅ ไม่มี lines
      },
    });

    res.json(created);
  } catch (err) {
    console.error("❌ Create template failed:", err);
    if (err?.code === "P2002") {
      // @@unique([scope, name]) ใน Prisma schema
      return res.status(400).json({ error: "ชื่อเทมเพลตซ้ำในขอบเขตนี้" });
    }
    res.status(500).json({ error: "สร้าง template ล้มเหลว" });
  }
});

// ---------- PUT: update ----------
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    const existing = await prisma.deliveryTemplate.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "ไม่พบ template นี้" });

    const scopeRaw =
      req.body.scope != null ? String(req.body.scope).toUpperCase() : existing.scope;
    const newScope = ALLOWED_SCOPES.has(scopeRaw) ? scopeRaw : existing.scope;

    let branchId =
      req.body.branchId === null
        ? null
        : req.body.branchId !== undefined
        ? toPosInt(req.body.branchId)
        : existing.branchId;

    let consignmentShopId =
      req.body.consignmentShopId === null
        ? null
        : req.body.consignmentShopId !== undefined
        ? toPosInt(req.body.consignmentShopId)
        : existing.consignmentShopId;

    let newName = typeof req.body.name === "string" ? req.body.name.trim() : existing.name;
    if (!newName) return res.status(400).json({ error: "name ต้องไม่ว่าง" });

    if (newScope === "GLOBAL") {
      branchId = null;
      consignmentShopId = null;
    } else if (newScope === "BRANCH_SHARED") {
      if (!branchId) return res.status(400).json({ error: "branchId จำเป็นเมื่อ scope=BRANCH_SHARED" });
      consignmentShopId = null;
    } else if (newScope === "CONSIGNMENT") {
      if (!consignmentShopId)
        return res.status(400).json({ error: "consignmentShopId จำเป็นเมื่อ scope=CONSIGNMENT" });
      branchId = null;
    }

    const data = {
      scope: newScope,
      branchId,
      consignmentShopId,
      name: newName,
    };
    if (req.body.config !== undefined) {
      data.config = pruneConfig(req.body.config); // ✅ ไม่มี lines
    }

    const updated = await prisma.deliveryTemplate.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error("❌ Update template failed:", err);
    if (err?.code === "P2002") {
      return res.status(400).json({ error: "ชื่อเทมเพลตซ้ำในขอบเขตนี้" });
    }
    res.status(500).json({ error: "แก้ไข template ล้มเหลว" });
  }
});

// ---------- DELETE ----------
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = toPosInt(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    await prisma.deliveryTemplate.delete({ where: { id } });
    res.json({ message: "ลบ template สำเร็จ" });
  } catch (err) {
    console.error("❌ Delete template failed:", err);
    res.status(500).json({ error: "ลบ template ล้มเหลว" });
  }
});

module.exports = router;
