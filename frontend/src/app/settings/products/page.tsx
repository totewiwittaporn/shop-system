"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";
import AuthLayout from "@/layouts/AuthLayout";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  barcode?: string;
}

interface ProductForm {
  id: number;
  name: string;
  description: string;
  categoryId?: number;
  barcode?: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    id: 0,
    name: "",
    description: "",
    categoryId: undefined,
    barcode: "",
  });
  const [error, setError] = useState("");

  // โหลดข้อมูลหมวดหมู่และสินค้าเมื่อหน้าเปิด
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  async function fetchCategories() {
    try {
      const res = await axios.get("/api/settings/categories");
      setCategories(res.data);
    } catch (err: any) {
      console.error("Fetch categories failed:", err);
    }
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await axios.get("/api/settings/products");
      setProducts(res.data);
    } catch (err: any) {
      console.error("Fetch products failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId,
      barcode: product.barcode || "",
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือว่าต้องการลบสินค้านี้?")) return;
    try {
      await axios.delete(`/api/settings/products/${id}`);
      fetchProducts();
    } catch (err: any) {
      console.error("Delete product failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || form.categoryId === undefined) {
      setError("กรุณากรอกชื่อสินค้าและเลือกหมวดหมู่");
      return;
    }

    try {
      if (form.id) {
        // Update
        await axios.put(`/api/settings/products/${form.id}`, form);
      } else {
        // Create
        await axios.post("/api/settings/products", form);
      }
      // Reset form
      setForm({ id: 0, name: "", description: "", categoryId: undefined, barcode: "" });
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.error || "บันทึกไม่สำเร็จ");
    }
  };

  return (
    <AuthLayout>
      <Card>
        <h1 className="text-2xl font-bold text-center mb-4">จัดการสินค้า</h1>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <Input
            type="text"
            placeholder="ชื่อสินค้า"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            type="text"
            placeholder="รายละเอียด"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Barcode"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
          />

          <Select
            value={form.categoryId?.toString()}
            onValueChange={(val: string) => setForm({ ...form, categoryId: Number(val) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกหมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" fullWidth variant="success">
            {form.id ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="bg-[var(--color-bg-card)]">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">ชื่อสินค้า</th>
                <th className="p-2 border">หมวดหมู่</th>
                <th className="p-2 border">Barcode</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    ยังไม่มีข้อมูลสินค้า
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-2 border">{p.id}</td>
                    <td className="p-2 border">{p.name}</td>
                    <td className="p-2 border">
                      {categories.find((c) => c.id === p.categoryId)?.name || "-"}
                    </td>
                    <td className="p-2 border">{p.barcode || "-"}</td>
                    <td className="p-2 border space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>
                        แก้ไข
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                        ลบ
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AuthLayout>
  );
}
