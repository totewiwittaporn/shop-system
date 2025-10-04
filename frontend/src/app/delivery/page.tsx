"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";

interface DeliveryLine {
  productId: number;
  quantity: number;
}

interface Delivery {
  id: number;
  branchId: number;
  date: string;
  status: "PENDING" | "SHIPPED" | "RECEIVED" | "CANCELED";
  lines: DeliveryLine[];
  template?: { id: number; name: string };
}

interface DeliveryTemplate {
  id: number;
  branchId: number;
  name: string;
  config: any;
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [templates, setTemplates] = useState<DeliveryTemplate[]>([]);
  const [form, setForm] = useState({
    branchId: "",
    templateId: "",
    lines: [] as DeliveryLine[],
  });

  useEffect(() => {
    fetchDeliveries();
    fetchTemplates();
  }, []);

  async function fetchDeliveries() {
    try {
      const res = await axios.get("/api/delivery-docs");
      setDeliveries(res.data);
    } catch (err) {
      console.error("โหลดข้อมูลการส่งสินค้าล้มเหลว", err);
    }
  }

  async function fetchTemplates() {
    try {
      const res = await axios.get("/api/settings/delivery-templates");
      setTemplates(res.data);
    } catch (err) {
      console.error("โหลด Delivery Templates ล้มเหลว", err);
    }
  }

  function handleTemplateChange(templateId: string) {
    const id = Number(templateId);
    setForm({ ...form, templateId: templateId });
    const template = templates.find((t) => t.id === id);
    if (template && template.config?.lines) {
      setForm((prev) => ({
        ...prev,
        lines: template.config.lines.map((l: any) => ({
          productId: l.productId,
          quantity: l.quantity,
        })),
      }));
    }
  }

  function handleLineChange(
    index: number,
    field: keyof DeliveryLine,
    value: string
  ) {
    const newLines = [...form.lines];
    newLines[index][field] = Number(value);
    setForm({ ...form, lines: newLines });
  }

  function addLine() {
    setForm({
      ...form,
      lines: [...form.lines, { productId: 0, quantity: 0 }],
    });
  }

  async function handleAddDelivery() {
    if (!form.branchId) return;
    try {
      await axios.post("/api/delivery-docs", {
        branchId: Number(form.branchId),
        lines: form.lines,
      });
      setForm({ branchId: "", templateId: "", lines: [] });
      fetchDeliveries();
    } catch (err) {
      console.error("เพิ่มการส่งสินค้าล้มเหลว", err);
    }
  }

  async function handleUpdateStatus(id: number, status: Delivery["status"]) {
    try {
      await axios.put(`/api/delivery-docs/${id}/status`, { status });
      fetchDeliveries();
    } catch (err) {
      console.error("อัปเดตสถานะล้มเหลว", err);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* ฟอร์มส่งสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>สร้างใบส่งสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            placeholder="Branch ID"
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          />

          <Select value={form.templateId} onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="เลือก Template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id.toString()}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
            <Button onClick={handleAddDelivery}>สร้างใบส่งสินค้า</Button>
          </div>
        </CardContent>
      </Card>

      {/* ตารางการส่งสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>รายการส่งสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">รหัส</th>
                <th className="p-2 border">สาขา</th>
                <th className="p-2 border">วันที่</th>
                <th className="p-2 border">สถานะ</th>
                <th className="p-2 border">Template</th>
                <th className="p-2 border">รายละเอียด</th>
                <th className="p-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td className="p-2 border">{d.id}</td>
                  <td className="p-2 border">{d.branchId}</td>
                  <td className="p-2 border">
                    {new Date(d.date).toLocaleString("th-TH")}
                  </td>
                  <td className="p-2 border">{d.status}</td>
                  <td className="p-2 border">
                    {d.template ? d.template.name : "-"}
                  </td>
                  <td className="p-2 border">
                    {d.lines.map((l, idx) => (
                      <div key={idx}>
                        สินค้า {l.productId} จำนวน {l.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="p-2 border space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleUpdateStatus(d.id, "SHIPPED")}
                    >
                      ส่งแล้ว
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleUpdateStatus(d.id, "RECEIVED")}
                    >
                      รับแล้ว
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus(d.id, "CANCELED")}
                    >
                      ยกเลิก
                    </Button>
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-2">
                    ไม่มีข้อมูลการส่งสินค้า
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
