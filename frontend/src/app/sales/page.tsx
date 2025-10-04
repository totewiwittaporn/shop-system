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
  price: number;
}

interface Sale {
  id: number;
  date: string;
  status: string;
  lines: { id: number; product: Product; quantity: number; price: number }[];
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<{ productId: string; quantity: string; price: string }>({
    productId: "",
    quantity: "1",
    price: "",
  });

  // โหลดข้อมูลสินค้าและการขาย
  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, []);

  async function fetchProducts() {
    try {
      const res = await axios.get("/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error("โหลดสินค้าไม่สำเร็จ", err);
    }
  }

  async function fetchSales() {
    try {
      const res = await axios.get("/api/sales");
      setSales(res.data);
    } catch (err) {
      console.error("โหลดรายการขายไม่สำเร็จ", err);
    }
  }

  async function handleAddSale() {
    if (!cart.productId || !cart.price) return;

    try {
      await axios.post("/api/sales", {
        branchId: 1, // สมมติเลือก branch 1, คุณสามารถแก้ให้เลือกได้
        items: [
          {
            productId: Number(cart.productId),
            quantity: Number(cart.quantity),
            price: Number(cart.price),
          },
        ],
      });

      setCart({ productId: "", quantity: "1", price: "" });
      fetchSales();
    } catch (err) {
      console.error("บันทึกการขายล้มเหลว", err);
    }
  }

  async function handleCancelSale(id: number) {
    try {
      await axios.put(`/api/sales/${id}/cancel`);
      fetchSales();
    } catch (err) {
      console.error("ยกเลิกการขายล้มเหลว", err);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* ฟอร์มบันทึกการขาย */}
      <Card>
        <CardHeader>
          <CardTitle>บันทึกการขาย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            className="border rounded p-2 w-full"
            value={cart.productId}
            onChange={(e) => {
              const product = products.find((p) => p.id === Number(e.target.value));
              setCart({
                ...cart,
                productId: e.target.value,
                price: product ? String(product.price) : "",
              });
            }}
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
            placeholder="จำนวน"
            value={cart.quantity}
            onChange={(e) => setCart({ ...cart, quantity: e.target.value })}
          />

          <Input
            type="number"
            placeholder="ราคา"
            value={cart.price}
            onChange={(e) => setCart({ ...cart, price: e.target.value })}
          />

          <Button onClick={handleAddSale}>บันทึกการขาย</Button>
        </CardContent>
      </Card>

      {/* รายการขาย */}
      <Card>
        <CardHeader>
          <CardTitle>รายการขาย</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">วันที่</th>
                <th className="p-2 border">สินค้า</th>
                <th className="p-2 border">จำนวน</th>
                <th className="p-2 border">ราคา</th>
                <th className="p-2 border">รวม</th>
                <th className="p-2 border">สถานะ</th>
                <th className="p-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="p-2 border">
                    {new Date(s.date).toLocaleDateString("th-TH")}
                  </td>
                  <td className="p-2 border">
                    {s.lines.map((l) => l.product?.name).join(", ")}
                  </td>
                  <td className="p-2 border">
                    {s.lines.map((l) => l.quantity).join(", ")}
                  </td>
                  <td className="p-2 border">
                    {s.lines.map((l) => l.price).join(", ")}
                  </td>
                  <td className="p-2 border">
                    {s.lines.reduce((sum, l) => sum + l.quantity * l.price, 0)}
                  </td>
                  <td className="p-2 border">{s.status}</td>
                  <td className="p-2 border">
                    {s.status === "ACTIVE" && (
                      <Button
                        variant="destructive"
                        onClick={() => handleCancelSale(s.id)}
                      >
                        ยกเลิก
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-2">
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
