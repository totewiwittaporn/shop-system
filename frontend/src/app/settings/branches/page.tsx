// settings/branches/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Branch = {
  id: number;
  name: string;
  location?: string;
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState<{ id?: number; name: string; location?: string }>({ name: "", location: "" });
  const [loading, setLoading] = useState(false);

  const fetchBranches = async () => {
    try {
      const res = await axios.get("/api/settings/branches");
      setBranches(res.data);
    } catch (err) {
      console.error("Fetch branches error:", err);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.id) {
        // Update
        await axios.put(`/api/settings/branches/${form.id}`, { name: form.name, location: form.location });
      } else {
        // Create
        await axios.post("/api/settings/branches", { name: form.name, location: form.location });
      }
      setForm({ name: "", location: "" });
      fetchBranches();
    } catch (err) {
      console.error("Save branch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setForm({ id: branch.id, name: branch.name, location: branch.location });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณต้องการลบสาขานี้หรือไม่?")) return;
    try {
      await axios.delete(`/api/settings/branches/${id}`);
      fetchBranches();
    } catch (err) {
      console.error("Delete branch error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold mb-4">จัดการสาขา</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
          <Input
            placeholder="ชื่อสาขา"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            placeholder="ที่อยู่ (ไม่บังคับ)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Button type="submit" variant="success" fullWidth={false} disabled={loading}>
            {form.id ? "แก้ไข" : "เพิ่ม"}
          </Button>
        </form>

        <div className="space-y-2">
          {branches.map((b) => (
            <div key={b.id} className="flex justify-between items-center border-b py-1">
              <div>
                <p className="font-medium">{b.name}</p>
                {b.location && <p className="text-sm text-gray-500">{b.location}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => handleEdit(b)}>
                  แก้ไข
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(b.id)}>
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
