"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: string;
  role: string;
  exp: number;
}

export function useAuth(requiredRole?: string[]) {
  const router = useRouter();
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState(true);   // ✅ กัน render ก่อนตรวจสอบเสร็จ

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      router.replace("/login");   // ✅ ไปหน้า login โดยตรง
      setLoading(false);
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);

      // ✅ ตรวจสอบ expiry
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        router.replace("/login");
        setLoading(false);
        return;
      }

      // ✅ ตรวจสอบ role
      if (requiredRole && !requiredRole.includes(decoded.role)) {
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");

        // redirect ตาม role จริง ๆ
        if (decoded.role === "admin") {
          router.replace("/admin/dashboard");
        } else if (decoded.role === "staff") {
          router.replace("/staff");
        } else if (decoded.role === "seller") {
          router.replace("/seller/products");
        } else {
          router.replace("/login");
        }

        setLoading(false);
        return;
      }

      setUser(decoded);
    } catch (err) {
      localStorage.removeItem("token");
      alert("Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่");
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [requiredRole, router]);

  // ✅ ตอนกำลังตรวจสอบ → return null
  if (loading) return null;

  return user;
}
