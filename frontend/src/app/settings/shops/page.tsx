// settings/shops/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type ConsignmentShop = {
  id: number;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
};

export default function ShopsPage() {
  const [shops, setShops] = useState<ConsignmentShop[]>([]);
  const [form, setForm] = useState<Partial<ConsignmentShop>>({ name: "" });
  const [loading, setLoading] = useState(false);

  const fetchShops = async () => {
    try {
      const res = await axios.get("/api/settings/shops");
      setShops(res.data);
    } catch (err) {
      console.error("Fetch shops error:", err);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    try {
      if (form.id) {
        await axios.put(`/api/settings/shops/${form.id}`, form);
      } else {
        await axios.post("/api/settings/shops", form);
      }
      setForm({ name: "" });
      fetchShops();
    } catch (err) {
      console.error("Save shop error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shop: ConsignmentShop) => {
    setForm({ ...shop });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณต้องการลบร้านฝากขายนี้หรือไม่?")) return;
    try {
      await axios.delete(`/api/settings/shops/${id}`);
      fetchShops();
    } catch (err) {
      console.error("Delete shop error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold mb-4">จัดการร้านฝากขาย</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
          <Input
            type="text"
            placeholder="ชื่อร้าน"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            type="text"
            placeholder="ผู้ติดต่อ"
            value={form.contact || ""}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
          <Input
            type="text"
            placeholder="เบอร์โทร"
            value={form.phone || ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            type="email"
            placeholder="อีเมล"
            value={form.email || ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            type="text"
            placeholder="ที่อยู่"
            value={form.address || ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            type="text"
            placeholder="เลขประจำตัวผู้เสียภาษี"
            value={form.taxId || ""}
            onChange={(e) => setForm({ ...form, taxId: e.target.value })}
          />

          <Button type="submit" variant="success" disabled={loading}>
            {form.id ? "แก้ไข" : "เพิ่ม"}
          </Button>
        </form>

        <div className="space-y-2">
          {shops.map((shop) => (
            <div key={shop.id} className="flex justify-between items-center border-b py-1">
              <div>
                <p className="font-medium">{shop.name}</p>
                <p className="text-sm text-gray-500">
                  ผู้ติดต่อ: {shop.contact}, โทร: {shop.phone}, อีเมล: {shop.email}, ที่อยู่: {shop.address}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => handleEdit(shop)}>
                  แก้ไข
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(shop.id)}>
                  ลบ
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
