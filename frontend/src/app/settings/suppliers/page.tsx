"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Supplier = {
  id: number;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<Partial<Supplier>>({ name: "" });
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get("/api/settings/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      console.error("Fetch suppliers error:", err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    try {
      if (form.id) {
        await axios.put(`/api/settings/suppliers/${form.id}`, form);
      } else {
        await axios.post("/api/settings/suppliers", form);
      }
      setForm({ name: "" });
      fetchSuppliers();
    } catch (err) {
      console.error("Save supplier error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setForm({ ...supplier });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณต้องการลบ supplier นี้หรือไม่?")) return;
    try {
      await axios.delete(`/api/settings/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      console.error("Delete supplier error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold mb-4">จัดการ Supplier</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
          <Input
            placeholder="ชื่อ Supplier"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            placeholder="เบอร์ติดต่อ"
            value={form.phone || ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            placeholder="อีเมล"
            value={form.email || ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="ที่อยู่"
            value={form.address || ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <Button type="submit" variant="success" disabled={loading}>
            {form.id ? "แก้ไข" : "เพิ่ม"}
          </Button>
        </form>

        <div className="space-y-2">
          {suppliers.map((s) => (
            <div key={s.id} className="flex justify-between items-center border-b py-1">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-gray-500">
                  {s.phone && `โทร: ${s.phone}`} {s.email && `| อีเมล: ${s.email}`}
                  {s.address && `| ที่อยู่: ${s.address}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => handleEdit(s)}>
                  แก้ไข
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>
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
