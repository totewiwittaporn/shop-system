"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import Button from "@/components/ui/Button";
import { User } from "lucide-react"; // import ไอคอน

interface User {
  id: number;
  email: string;
  role: string;
  branchId?: number | null;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = Cookies.get("token");
        if (!token) return;

        // เรียก backend ตรง ๆ
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.authenticated) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("โหลดข้อมูลผู้ใช้ล้มเหลว", err);
        setUser(null);
      }
    }

    fetchUser();
  }, []);

  const handleLogout = () => {
    // ลบ token
    localStorage.removeItem("token");
    Cookies.remove("token");

    // redirect ไป login
    router.replace("/login");
  };

  return (
    <nav className="w-full bg-[var(--color-bg-card)] border-b border-[var(--color-border)] shadow-md flex justify-between items-center px-6 py-3">
      {/* โลโก้ / ชื่อระบบ */}
      <div className="text-xl font-bold text-[var(--color-text)]">
        Chalin Shop System
      </div>

      {/* ข้อมูลผู้ใช้ + ปุ่ม Logout */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="text-[var(--color-text)] flex items-center gap-2">
            <User className="w-5 h-5" /> {/* ขนาด 20px */}
            {user.email} ({user.role})
          </div>
        ) : (
          <div className="text-[var(--color-text-muted)]">กำลังโหลด...</div>
        )}
        <Button type="button" variant="danger" onClick={handleLogout}>
          ออกจากระบบ
        </Button>
      </div>
    </nav>
  );
}
