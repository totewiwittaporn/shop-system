// src/app/settings/categories/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Category = {
  id: number;
  name: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<Partial<Category>>({ name: "" });
  const [loading, setLoading] = useState(false);

  // 🔹 ดึงข้อมูลหมวดหมู่
  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/settings/categories");
      setCategories(res.data);
    } catch (err: any) {
      console.error("Fetch categories error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        alert("Token หมดอายุหรือไม่ถูกต้อง กรุณา login ใหม่");
      }
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 🔹 เพิ่ม / แก้ไขหมวดหมู่
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    setLoading(true);
    try {
      if (form.id) {
        await axios.put(`/api/settings/categories/${form.id}`, { name: form.name });
      } else {
        await axios.post("/api/settings/categories", { name: form.name });
      }
      setForm({ name: "" });
      fetchCategories();
    } catch (err: any) {
      console.error("Save category error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        alert("Token หมดอายุหรือไม่ถูกต้อง กรุณา login ใหม่");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setForm({ ...category });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณต้องการลบหมวดหมู่นี้หรือไม่?")) return;
    try {
      await axios.delete(`/api/settings/categories/${id}`);
      fetchCategories();
    } catch (err: any) {
      console.error("Delete category error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        alert("Token หมดอายุหรือไม่ถูกต้อง กรุณา login ใหม่");
      }
    }
  };

  return (
    <div className="space-y-4 p-6">
      <Card>
        <h1 className="text-xl font-bold mb-4">จัดการหมวดหมู่สินค้า</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
          <Input
            type="text"
            placeholder="ชื่อหมวดหมู่"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Button type="submit" variant="primary" disabled={loading}>
            {form.id ? "แก้ไข" : "เพิ่ม"}
          </Button>
        </form>

        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex justify-between items-center border-b py-1">
              <div>
                <p className="font-medium">{c.name}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={() => handleEdit(c)}>
                  แก้ไข
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                  ลบ
                </Button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-center text-gray-500 py-2">ไม่มีหมวดหมู่</p>
          )}
        </div>
      </Card>
    </div>
  );
}
