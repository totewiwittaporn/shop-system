"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import AuthLayout from "@/layouts/AuthLayout";
import Cookies from "js-cookie";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, form);

      // ✅ เก็บ token ทั้งใน localStorage และ cookie
      const token = res.data.token;
      localStorage.setItem("token", token);
      Cookies.set("token", token, { expires: 1 }); // เก็บ cookie 1 วัน

      // ✅ redirect ไปหน้า dashboard
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "เข้าสู่ระบบไม่สำเร็จ");
    }
  }

  return (
    <AuthLayout>
      <Card>
        <h1 className="text-2xl font-bold text-center">เข้าสู่ระบบ</h1>
        <br />

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="อีเมล"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            type="password"
            placeholder="รหัสผ่าน"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit" fullWidth variant="primary"
          >
            เข้าสู่ระบบ
          </Button>
        </form>

        <br />
        <p className="text-sm text-center text-gray-400">
          ยังไม่มีบัญชี?{" "}
          <a href="/register" className="text-green-600 hover:underline">
            สมัครสมาชิก
          </a>
        </p>
      </Card>
    </AuthLayout>
  );
}
