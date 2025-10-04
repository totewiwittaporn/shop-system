// settings/branchProducts/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

type Branch = { id: number; name: string };
type Product = { id: number; name: string };
type BranchProduct = {
  id: number;
  branchId: number;
  productId: number;
  name?: string;
  price: number;
  stock: number;
};

export default function BranchProductsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchProducts, setBranchProducts] = useState<BranchProduct[]>([]);
  const [form, setForm] = useState<Partial<BranchProduct>>({ branchId: undefined, productId: undefined, name: "", price: 0, stock: 0 });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [bRes, pRes, bpRes] = await Promise.all([
        axios.get("/api/settings/branches"),
        axios.get("/api/settings/products"),
        axios.get("/api/settings/branchProducts"),
      ]);
      setBranches(bRes.data);
      setProducts(pRes.data);
      setBranchProducts(bpRes.data);
    } catch (err) {
      console.error("Fetch data error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.branchId || !form.productId) return;
    setLoading(true);
    try {
      if (form.id) {
        await axios.put(`/api/settings/branchProducts/${form.id}`, form);
      } else {
        await axios.post("/api/settings/branchProducts", form);
      }
      setForm({ branchId: undefined, productId: undefined, name: "", price: 0, stock: 0 });
      fetchData();
    } catch (err) {
      console.error("Save branch product error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bp: BranchProduct) => {
    setForm({ ...bp });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณต้องการลบสินค้านี้ออกจากสาขาหรือไม่?")) return;
    try {
      await axios.delete(`/api/settings/branchProducts/${id}`);
      fetchData();
    } catch (err) {
      console.error("Delete branch product error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold mb-4">จัดการสินค้าตามสาขา</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
          <Select value={form.branchId?.toString()} onValueChange={(val) => setForm({ ...form, branchId: Number(val) })}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกสาขา" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id.toString()}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={form.productId?.toString()} onValueChange={(val) => setForm({ ...form, productId: Number(val) })}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกสินค้า" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="ชื่อสินค้าสำหรับสาขา (ไม่บังคับ)"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="ราคาขาย"
            value={form.price || 0}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
          />
          <Input
            type="number"
            placeholder="สต็อกเริ่มต้น"
            value={form.stock || 0}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            required
          />

          <Button type="submit" variant="success" disabled={loading}>
            {form.id ? "แก้ไข" : "เพิ่ม"}
          </Button>
        </form>

        <div className="space-y-2">
          {branchProducts.map((bp) => (
            <div key={bp.id} className="flex justify-between items-center border-b py-1">
              <div>
                <p className="font-medium">{bp.name || products.find((p) => p.id === bp.productId)?.name}</p>
                <p className="text-sm text-gray-500">
                  สาขา: {branches.find((b) => b.id === bp.branchId)?.name}, ราคา: {bp.price}, สต็อก: {bp.stock}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => handleEdit(bp)}>
                  แก้ไข
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(bp.id)}>
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
