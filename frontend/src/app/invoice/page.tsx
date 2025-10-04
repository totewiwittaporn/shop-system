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

interface InvoiceLine {
  productId: number;
  quantity: number;
  price: number;
}

interface Invoice {
  id: number;
  branchId: number;
  date: string;
  total: number;
  status: "OPEN" | "PAID" | "CANCELED";
  lines: InvoiceLine[];
}

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState({
    branchId: "",
    lines: [{ productId: "", quantity: "", price: "" }],
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const res = await axios.get("/api/invoices");
      setInvoices(res.data);
    } catch (err) {
      console.error("โหลดข้อมูลใบแจ้งหนี้ล้มเหลว", err);
    }
  }

  async function handleAddInvoice() {
    if (!form.branchId) return;
    try {
      await axios.post("/api/invoices", {
        branchId: Number(form.branchId),
        lines: form.lines.map((l) => ({
          productId: Number(l.productId),
          quantity: Number(l.quantity),
          price: Number(l.price),
        })),
      });
      setForm({ branchId: "", lines: [{ productId: "", quantity: "", price: "" }] });
      fetchInvoices();
    } catch (err) {
      console.error("เพิ่มใบแจ้งหนี้ล้มเหลว", err);
    }
  }

  async function handleUpdateStatus(id: number, status: Invoice["status"]) {
    try {
      await axios.put(`/api/invoices/${id}/status`, { status });
      fetchInvoices();
    } catch (err) {
      console.error("อัปเดตสถานะใบแจ้งหนี้ล้มเหลว", err);
    }
  }

  function handleLineChange(index: number, field: string, value: string) {
    const newLines = [...form.lines];
    (newLines[index] as any)[field] = value;
    setForm({ ...form, lines: newLines });
  }

  function addLine() {
    setForm({
      ...form,
      lines: [...form.lines, { productId: "", quantity: "", price: "" }],
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* ฟอร์มสร้างใบแจ้งหนี้ */}
      <Card>
        <CardHeader>
          <CardTitle>สร้างใบแจ้งหนี้</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            placeholder="Branch ID"
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          />

          <div className="space-y-2">
            {form.lines.map((line, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Product ID"
                  value={line.productId}
                  onChange={(e) =>
                    handleLineChange(idx, "productId", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="จำนวน"
                  value={line.quantity}
                  onChange={(e) =>
                    handleLineChange(idx, "quantity", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="ราคา"
                  value={line.price}
                  onChange={(e) =>
                    handleLineChange(idx, "price", e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={addLine}>
              + เพิ่มสินค้า
            </Button>
            <Button onClick={handleAddInvoice}>สร้างใบแจ้งหนี้</Button>
          </div>
        </CardContent>
      </Card>

      {/* ตารางใบแจ้งหนี้ */}
      <Card>
        <CardHeader>
          <CardTitle>รายการใบแจ้งหนี้</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">รหัส</th>
                <th className="p-2 border">สาขา</th>
                <th className="p-2 border">วันที่</th>
                <th className="p-2 border">สถานะ</th>
                <th className="p-2 border">รวม</th>
                <th className="p-2 border">รายละเอียด</th>
                <th className="p-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="p-2 border">{inv.id}</td>
                  <td className="p-2 border">{inv.branchId}</td>
                  <td className="p-2 border">
                    {new Date(inv.date).toLocaleString("th-TH")}
                  </td>
                  <td className="p-2 border">{inv.status}</td>
                  <td className="p-2 border">{inv.total}</td>
                  <td className="p-2 border">
                    {inv.lines.map((l, idx) => (
                      <div key={idx}>
                        สินค้า {l.productId} จำนวน {l.quantity} ราคา {l.price}
                      </div>
                    ))}
                  </td>
                  <td className="p-2 border space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleUpdateStatus(inv.id, "PAID")}
                    >
                      ชำระแล้ว
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus(inv.id, "CANCELED")}
                    >
                      ยกเลิก
                    </Button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-2">
                    ไม่มีข้อมูลใบแจ้งหนี้
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
