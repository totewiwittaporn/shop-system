"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
  });
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await axios.get("/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error("โหลดสินค้าล้มเหลว", err);
    }
  }

  async function handleAddProduct() {
    if (!form.name || !form.sku || !form.price) return;
    try {
      await axios.post("/api/products", {
        name: form.name,
        sku: form.sku,
        price: Number(form.price),
      });
      setForm({ name: "", sku: "", price: "" });
      fetchProducts();
    } catch (err) {
      console.error("เพิ่มสินค้าล้มเหลว", err);
    }
  }

  async function handleUpdateProduct() {
    if (!editId) return;
    try {
      await axios.put(`/api/products/${editId}`, {
        name: form.name,
        sku: form.sku,
        price: Number(form.price),
      });
      setEditId(null);
      setForm({ name: "", sku: "", price: "" });
      fetchProducts();
    } catch (err) {
      console.error("อัปเดตสินค้าล้มเหลว", err);
    }
  }

  async function handleDeleteProduct(id: number) {
    try {
      await axios.delete(`/api/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error("ลบสินค้าล้มเหลว", err);
    }
  }

  function handleEdit(product: Product) {
    setEditId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* ฟอร์มสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>{editId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="ชื่อสินค้า"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            type="text"
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
          <Input
            type="number"
            placeholder="ราคา"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />

          {editId ? (
            <div className="flex gap-2">
              <Button onClick={handleUpdateProduct}>บันทึกการแก้ไข</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditId(null);
                  setForm({ name: "", sku: "", price: "" });
                }}
              >
                ยกเลิก
              </Button>
            </div>
          ) : (
            <Button onClick={handleAddProduct}>เพิ่มสินค้า</Button>
          )}
        </CardContent>
      </Card>

      {/* ตารางสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>รายการสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">ชื่อสินค้า</th>
                <th className="p-2 border">SKU</th>
                <th className="p-2 border">ราคา</th>
                <th className="p-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="p-2 border">{p.name}</td>
                  <td className="p-2 border">{p.sku}</td>
                  <td className="p-2 border">{p.price}</td>
                  <td className="p-2 border space-x-2">
                    <Button variant="secondary" onClick={() => handleEdit(p)}>
                      แก้ไข
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteProduct(p.id)}
                    >
                      ลบ
                    </Button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-2">
                    ไม่มีข้อมูลสินค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
