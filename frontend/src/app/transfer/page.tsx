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

interface TransferLine {
  productId: number;
  quantity: number;
}

interface Transfer {
  id: number;
  fromBranchId: number;
  toBranchId: number;
  date: string;
  status: "PENDING" | "SHIPPED" | "RECEIVED" | "CANCELED";
  lines: TransferLine[];
}

export default function TransferPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [form, setForm] = useState({
    fromBranchId: "",
    toBranchId: "",
    lines: [{ productId: "", quantity: "" }],
  });

  useEffect(() => {
    fetchTransfers();
  }, []);

  async function fetchTransfers() {
    try {
      const res = await axios.get("/api/transfers");
      setTransfers(res.data);
    } catch (err) {
      console.error("โหลดข้อมูลการโอนสินค้าล้มเหลว", err);
    }
  }

  async function handleAddTransfer() {
    if (!form.fromBranchId || !form.toBranchId) return;
    try {
      await axios.post("/api/transfers", {
        fromBranchId: Number(form.fromBranchId),
        toBranchId: Number(form.toBranchId),
        lines: form.lines.map((l) => ({
          productId: Number(l.productId),
          quantity: Number(l.quantity),
        })),
      });
      setForm({
        fromBranchId: "",
        toBranchId: "",
        lines: [{ productId: "", quantity: "" }],
      });
      fetchTransfers();
    } catch (err) {
      console.error("เพิ่มการโอนสินค้าล้มเหลว", err);
    }
  }

  async function handleUpdateStatus(id: number, status: Transfer["status"]) {
    try {
      await axios.put(`/api/transfers/${id}/status`, { status });
      fetchTransfers();
    } catch (err) {
      console.error("อัปเดตสถานะล้มเหลว", err);
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
      lines: [...form.lines, { productId: "", quantity: "" }],
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* ฟอร์มโอนสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>สร้างใบโอนสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            placeholder="From Branch ID"
            value={form.fromBranchId}
            onChange={(e) => setForm({ ...form, fromBranchId: e.target.value })}
          />
          <Input
            type="number"
            placeholder="To Branch ID"
            value={form.toBranchId}
            onChange={(e) => setForm({ ...form, toBranchId: e.target.value })}
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
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={addLine}>
              + เพิ่มสินค้า
            </Button>
            <Button onClick={handleAddTransfer}>สร้างใบโอน</Button>
          </div>
        </CardContent>
      </Card>

      {/* ตารางโอนสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>รายการโอนสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">รหัส</th>
                <th className="p-2 border">จากสาขา</th>
                <th className="p-2 border">ไปยังสาขา</th>
                <th className="p-2 border">วันที่</th>
                <th className="p-2 border">สถานะ</th>
                <th className="p-2 border">รายละเอียด</th>
                <th className="p-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td className="p-2 border">{t.id}</td>
                  <td className="p-2 border">{t.fromBranchId}</td>
                  <td className="p-2 border">{t.toBranchId}</td>
                  <td className="p-2 border">
                    {new Date(t.date).toLocaleString("th-TH")}
                  </td>
                  <td className="p-2 border">{t.status}</td>
                  <td className="p-2 border">
                    {t.lines.map((l, idx) => (
                      <div key={idx}>
                        สินค้า {l.productId} จำนวน {l.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="p-2 border space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleUpdateStatus(t.id, "SHIPPED")}
                    >
                      ส่งแล้ว
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleUpdateStatus(t.id, "RECEIVED")}
                    >
                      รับแล้ว
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus(t.id, "CANCELED")}
                    >
                      ยกเลิก
                    </Button>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-2">
                    ไม่มีข้อมูลการโอนสินค้า
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
