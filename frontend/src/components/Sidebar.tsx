"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
  const user = useAuth();

  if (!user) return null;

  const menus = [
    {
      section: "ภาพรวม",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          roles: ["admin", "staff", "customer"],
        },
      ],
    },
    {
      section: "สินค้า",
      items: [
        {
          name: "จัดการสต็อกสินค้า",
          path: "/stock",
          roles: ["admin", "staff", "customer"],
        },
        {
          name: "ฝากขายสินค้า",
          path: "/consignment",
          roles: ["admin"],
        },
        {
          name: "ซื้อสินค้า",
          path: "/purchase",
          roles: ["admin"],
        },
      ],
    },
    {
      section: "ธุรกรรม",
      items: [
        {
          name: "ขายสินค้า (POS)",
          path: "/sales",
          roles: ["admin", "staff"],
        },
        {
          name: "ระบบส่งสินค้า",
          path: "/delivery",
          roles: ["admin"],
        },
      ],
    },
    {
      section: "ระบบ",
      items: [
        {
          name: "จัดการผู้ใช้",
          path: "/users", // ✅ หน้าใหม่ที่เราจะทำต่อ
          roles: ["admin"],
        },
        {
          name: "ตั้งค่า",
          path: "/settings",
          roles: ["admin"],
        },
      ],
    },
  ];

  return (
    <aside className="w-64 h-screen bg-gray-800 text-white flex flex-col">
      <div className="p-4 font-bold text-xl border-b border-gray-700">
        เมนูหลัก
      </div>
      <nav className="flex-1 p-2">
        {menus.map((group) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(user.role)
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.section} className="mb-4">
              <div className="text-gray-400 text-xs uppercase px-2 py-1">
                {group.section}
              </div>
              {visibleItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="block p-2 rounded hover:bg-gray-700"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
