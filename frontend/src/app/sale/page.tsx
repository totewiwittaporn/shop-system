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

interface SaleLine {
  productId: number;
  quantity: number;
  price: number;
}

interface Sale {
  id: number;
  branchId: number;
  date: string;
  status: string;
  lines: SaleLine[];
}

export default function SalePage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [form, setForm] = useState({
    branchId: "",
    items: [{ productId: "", quantity: "", price: "" }],
  });

  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    try {
      const res = await axios.get("/api/sales");
      setSales(res.data);
    } catch (err) {
      console.error("โหลดข้อมูลการขายล้มเหลว", err);
    }
  }

  async function handleAddSale() {
    if (!form.branchId) return;
    try {
      await axios.post("/api/sales", {
        branchId: Number(form.branchId),
        items: form.items.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
          price: Number(i.price),
        })),
      });
      setForm({ branchId: "", items: [{ productId: "", quantity: "", price: "" }] });
      fetchSales();
    } catch (err) {
      console.error("เพิ่มการขายล้มเหลว", err);
    }
  }

  function handleItemChange(index: number, field: string, value: string) {
    const newItems = [...form.items];
    (newItems[index] as any)[field] = value;
    setForm({ ...form, items: newItems });
  }

  function addItem() {
    setForm({
      ...form,
      items: [...form.items, { productId: "", quantity: "", price: "" }],
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* ฟอร์มขายสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>บันทึกการขายสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            placeholder="Branch ID"
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          />

          <div className="space-y-2">
            {form.items.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Product ID"
                  value={item.productId}
                  onChange={(e) =>
                    handleItemChange(idx, "productId", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="จำนวน"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(idx, "quantity", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="ราคา"
                  value={item.price}
                  onChange={(e) =>
                    handleItemChange(idx, "price", e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={addItem}>
              + เพิ่มสินค้า
            </Button>
            <Button onClick={handleAddSale}>บันทึกการขาย</Button>
          </div>
        </CardContent>
      </Card>

      {/* ตารางการขาย */}
      <Card>
        <CardHeader>
          <CardTitle>รายการขายสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">รหัส</th>
                <th className="p-2 border">สาขา</th>
                <th className="p-2 border">วันที่</th>
                <th className="p-2 border">สถานะ</th>
                <th className="p-2 border">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="p-2 border">{s.id}</td>
                  <td className="p-2 border">{s.branchId}</td>
                  <td className="p-2 border">
                    {new Date(s.date).toLocaleString("th-TH")}
                  </td>
                  <td className="p-2 border">{s.status}</td>
                  <td className="p-2 border">
                    {s.lines.map((l, idx) => (
                      <div key={idx}>
                        สินค้า {l.productId} จำนวน {l.quantity} ราคา {l.price}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-2">
                    ไม่มีข้อมูลการขาย
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
