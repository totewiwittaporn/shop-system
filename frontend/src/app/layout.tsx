"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";
import api from "@/lib/axios";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    async function checkAuth() {
      // ✅ ถ้าอยู่หน้าแรก "/" → ไม่ต้องตรวจสอบสิทธิ์
      if (pathname === "/") {
        setLoading(false);
        return;
      }

      // ✅ ถ้าอยู่หน้า login หรือ register → ไม่ต้องตรวจสอบ
      if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`${API_URL}/api/auth/me`);
        if (res.data?.authenticated) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          router.replace("/login");
        }
      } catch (err) {
        setAuthenticated(false);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  if (loading) {
    return (
      <html lang="th">
        <body>
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-lg">กำลังตรวจสอบสิทธิ์...</p>
          </div>
        </body>
      </html>
    );
  }

  const isAuthPage =
    pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <html lang="th">
      <body>
        {isAuthPage ? (
          // ✅ หน้าแรก, login, register → ไม่ต้องใช้ MainLayout
          <AuthLayout>{children}</AuthLayout>
        ) : authenticated ? (
          <MainLayout>{children}</MainLayout>
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-red-500 text-lg">ไม่ได้รับอนุญาต</p>
          </div>
        )}
      </body>
    </html>
  );
}
