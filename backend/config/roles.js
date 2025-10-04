// backend/config/roles.js

/**
 * 📌 ROLE DEFINITIONS
 * - admin: เจ้าของธุรกิจ / ร้านหลัก
 *   → เข้าถึงทุกอย่าง ดู/เพิ่ม/แก้ไข/ลบ ข้อมูลได้ทั้งหมด
 * - staff: พนักงานขายหน้าร้านสาขา
 *   → ดู/แก้ไข stock หรือขายสินค้าเฉพาะสาขาของตัวเอง
 * - customer: พนักงานหน้าร้านฝากขาย
 *   → ดู stock หรือขายสินค้าเฉพาะสาขาของตัวเอง (ไม่แก้ไข stock ของสาขา)
 */

const ROLE_PERMISSIONS = {
  admin: {
    canRead: "any",    // อ่านข้อมูลได้ทุกสาขา
    canWrite: "any",   // เพิ่ม/แก้ไขข้อมูลได้ทุกสาขา
    canDelete: "any",  // ลบข้อมูลได้ทุกสาขา
  },
  staff: {
    canRead: "branch",  // อ่านข้อมูลเฉพาะสาขาตัวเอง
    canWrite: "branch", // แก้ไขข้อมูลเฉพาะสาขาตัวเอง
    canDelete: null,    // ไม่สามารถลบข้อมูล
  },
  customer: {
    canRead: "branch",  // อ่านข้อมูลเฉพาะสาขาตัวเอง
    canWrite: null,     // ไม่สามารถแก้ไขข้อมูล
    canDelete: null,    // ไม่สามารถลบข้อมูล
  },
};

module.exports = ROLE_PERMISSIONS;
