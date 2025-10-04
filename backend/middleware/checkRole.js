// middleware/checkRole.js
/**
 * ใช้ตรวจสอบว่า role ของ user อยู่ใน allowedRoles หรือไม่
 * ตัวอย่าง:
 * checkRole(['admin', 'staff'])
 */
function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Role not allowed" });
    }

    next();
  };
}

module.exports = checkRole;
