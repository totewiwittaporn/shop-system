"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Consignment {
  id: number;
  price: number;
  quantity: number;
  product: { id: number; name: string };
  shop: { id: number; name: string };
}

interface ConsignmentShop {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

export default function ConsignmentPage() {
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [shops, setShops] = useState<ConsignmentShop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    shopId: "",
    productId: "",
    price: "",
    quantity: "",
  });

  // โหลดข้อมูลจาก API
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [cRes, sRes, pRes] = await Promise.all([
        axios.get("/api/consignments"),
        axios.get("/api/consignments/shops"),
        axios.get("/api/products"),
      ]);
      setConsignments(cRes.data);
      setShops(sRes.data);
      setProducts(pRes.data);
    } catch (err) {
      console.error("โหลดข้อมูลล้มเหลว", err);
    }
  }

  async function handleAdd() {
    try {
      await axios.post("/api/consignments", {
        shopId: Number(form.shopId),
        productId: Number(form.productId),
        price: Number(form.price),
        quantity: Number(form.quantity),
      });
      setForm({ shopId: "", productId: "", price: "", quantity: "" });
      fetchData();
    } catch (err) {
      console.error("เพิ่มรายการฝากขายล้มเหลว", err);
    }
  }

  async function handleDelete(id: number) {
    try {
      await axios.delete(`/api/consignments/${id}`);
      fetchData();
    } catch (err) {
      console.error("ลบรายการฝากขายล้มเหลว", err);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>เพิ่มรายการฝากขาย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            className="border rounded p-2 w-full"
            value={form.shopId}
            onChange={(e) => setForm({ ...form, shopId: e.target.value })}
          >
            <option value="">เลือกร้านคู่ค้า</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            className="border rounded p-2 w-full"
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
          >
            <option value="">เลือกสินค้า</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <Input
            type="number"
            placeholder="ราคาขาย"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />

          <Input
            type="number"
            placeholder="จำนวน"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />

          <Button onClick={handleAdd}>เพิ่มรายการ</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการฝากขาย</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">ร้านคู่ค้า</th>
                <th className="p-2 border">สินค้า</th>
                <th className="p-2 border">ราคา</th>
                <th className="p-2 border">จำนวน</th>
                <th className="p-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {consignments.map((c) => (
                <tr key={c.id}>
                  <td className="p-2 border">{c.shop?.name}</td>
                  <td className="p-2 border">{c.product?.name}</td>
                  <td className="p-2 border">{c.price}</td>
                  <td className="p-2 border">{c.quantity}</td>
                  <td className="p-2 border">
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(c.id)}
                    >
                      ลบ
                    </Button>
                  </td>
                </tr>
              ))}
              {consignments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-2">
                    ไม่มีข้อมูล
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
