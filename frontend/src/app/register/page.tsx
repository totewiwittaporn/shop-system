"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import AuthLayout from "@/layouts/AuthLayout";
import Cookies from "js-cookie";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    branchId: "", // ✅ เพิ่ม branchId
  });
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  // ✅ โหลดรายชื่อ branch จาก backend
  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await axios.get("/api/branches");
        setBranches(res.data || []);
      } catch (err) {
        console.error("โหลดสาขาไม่สำเร็จ:", err);
      }
    }
    fetchBranches();
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!form.branchId) {
      setError("กรุณาเลือกสาขา");
      return;
    }

    try {
      // ✅ สมัครสมาชิก
      const res = await axios.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        branchId: form.branchId, // ✅ ส่ง branchId ไปด้วย
      });

      // ✅ ถ้า backend ส่ง token กลับมา → เก็บ token แล้ว auto login
      if (res.data.token) {
        const token = res.data.token;
        localStorage.setItem("token", token);
        Cookies.set("token", token, { expires: 1 });

        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "สมัครสมาชิกไม่สำเร็จ");
    }
  }

  return (
    <AuthLayout>
      <Card>
        <h1 className="text-2xl font-bold text-center">สมัครสมาชิก</h1>
        <br />

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="ชื่อ"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="email"
            placeholder="อีเมล"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="ยืนยันรหัสผ่าน"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            className="w-full border p-2 rounded"
            required
          />

          {/* ✅ Dropdown เลือกสาขา */}
          <select
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">เลือกสาขา</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" fullWidth variant="success">
            สมัครสมาชิก
          </Button>
        </form>
        <br />
        <p className="text-sm text-center text-gray-600">
          มีบัญชีอยู่แล้ว?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            เข้าสู่ระบบ
          </a>
        </p>
      </Card>
    </AuthLayout>
  );
}
