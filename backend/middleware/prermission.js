// middleware/permission.js
const ROLE_PERMISSIONS = require("../config/roles");

/**
 * ใช้ตรวจสอบว่า user มีสิทธิ์ทำ action ที่ระบุหรือไม่
 * action = 'read' | 'write' | 'delete'
 * scope = 'any' | 'branch' | 'own'
 */
function checkPermission(action) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const role = req.user.role;
    const permissions = ROLE_PERMISSIONS[role];

    if (!permissions) {
      return res.status(403).json({ error: "Forbidden: Role not recognized" });
    }

    const scopeKey = `can${action[0].toUpperCase() + action.slice(1)}`; // e.g. canRead
    const scope = permissions[scopeKey];

    if (!scope) {
      return res.status(403).json({ error: `Forbidden: No permission to ${action}` });
    }

    // เก็บ scope ไว้ให้ route ใช้งาน เช่น ตรวจสอบ branchId
    req.permissionScope = scope;
    next();
  };
}

module.exports = checkPermission;
