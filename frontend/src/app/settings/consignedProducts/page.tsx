// settings/consignedProducts/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

type Branch = { id: number; name: string };
type Product = { id: number; name: string };
type ConsignmentShop = { id: number; name: string };
type ConsignedProduct = {
  id: number;
  shopId: number;
  productId: number;
  branchId: number;
  price: number;
  quantity: number;
};

export default function ConsignedProductsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<ConsignmentShop[]>([]);
  const [consignedProducts, setConsignedProducts] = useState<ConsignedProduct[]>([]);
  const [form, setForm] = useState<Partial<ConsignedProduct>>({ shopId: undefined, productId: undefined, branchId: undefined, price: 0, quantity: 0 });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [bRes, pRes, sRes, cpRes] = await Promise.all([
        axios.get("/api/settings/branches"),
        axios.get("/api/settings/products"),
        axios.get("/api/settings/shops"),
        axios.get("/api/settings/consignedProducts"),
      ]);
      setBranches(bRes.data);
      setProducts(pRes.data);
      setShops(sRes.data);
      setConsignedProducts(cpRes.data);
    } catch (err) {
      console.error("Fetch data error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopId || !form.productId || !form.branchId) return;
    setLoading(true);
    try {
      if (form.id) {
        await axios.put(`/api/settings/consignedProducts/${form.id}`, form);
      } else {
        await axios.post("/api/settings/consignedProducts", form);
      }
      setForm({ shopId: undefined, productId: undefined, branchId: undefined, price: 0, quantity: 0 });
      fetchData();
    } catch (err) {
      console.error("Save consigned product error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cp: ConsignedProduct) => {
    setForm({ ...cp });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณต้องการลบสินค้านี้ออกจากร้านฝากขายหรือไม่?")) return;
    try {
      await axios.delete(`/api/settings/consignedProducts/${id}`);
      fetchData();
    } catch (err) {
      console.error("Delete consigned product error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold mb-4">จัดการสินค้าฝากขาย</h1>
            <p>เลือกร้านค้า :</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
          <Select value={form.shopId?.toString()} onValueChange={(val) => setForm({ ...form, shopId: Number(val) })}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกร้านฝากขาย" />
            </SelectTrigger>
            <SelectContent>
              {shops.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
              <p>เลือกสาขา :</p>

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
              <p>เลือกสินค้า :</p>
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
              <p>ราคาฝากขาย :</p>
          <Input
            type="number"
            placeholder="ราคาฝากขาย"
            value={form.price || 0}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
          />
          <p>จำนวนสินค้า :</p>
          <Input
            type="number"
            placeholder="จำนวนสินค้า"
            value={form.quantity || 0}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            required
          />

          <Button type="submit" variant="success" disabled={loading}>
            {form.id ? "แก้ไข" : "เพิ่ม"}
          </Button>
        </form>

        <div className="space-y-2">
          {consignedProducts.map((cp) => (
            <div key={cp.id} className="flex justify-between items-center border-b py-1">
              <div>
                <p className="font-medium">{products.find((p) => p.id === cp.productId)?.name}</p>
                <p className="text-sm text-gray-500">
                  ร้าน: {shops.find((s) => s.id === cp.shopId)?.name}, สาขา: {branches.find((b) => b.id === cp.branchId)?.name}, ราคา: {cp.price}, จำนวน: {cp.quantity}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => handleEdit(cp)}>
                  แก้ไข
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(cp.id)}>
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
