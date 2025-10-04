"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface DeliveryTemplate {
  id: number;
  branchId: number;
  name: string;
  config: any;
}

export default function DeliveryTemplatePage() {
  const [templates, setTemplates] = useState<DeliveryTemplate[]>([]);
  const [form, setForm] = useState<{ id?: number; branchId: string; name: string; config: string }>({
    branchId: "",
    name: "",
    config: "{}",
  });
  const [loading, setLoading] = useState(false);

  // ดึงข้อมูล template
  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await axios.get("/api/settings/delivery-templates");
      setTemplates(res.data);
    } catch (err) {
      console.error("โหลด template ล้มเหลว", err);
    }
  }

  async function handleSubmit() {
    if (!form.branchId || !form.name) return;
    setLoading(true);
    try {
      if (form.id) {
        // แก้ไข template
        await axios.put(`/api/settings/delivery-templates/${form.id}`, {
          name: form.name,
          config: JSON.parse(form.config),
        });
      } else {
        // เพิ่ม template ใหม่
        await axios.post("/api/settings/delivery-templates", {
          branchId: Number(form.branchId),
          name: form.name,
          config: JSON.parse(form.config),
        });
      }
      setForm({ branchId: "", name: "", config: "{}" });
      fetchTemplates();
    } catch (err) {
      console.error("บันทึก template ล้มเหลว", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(template: DeliveryTemplate) {
    setForm({
      id: template.id,
      branchId: template.branchId.toString(),
      name: template.name,
      config: JSON.stringify(template.config || {}, null, 2),
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("ยืนยันการลบ template?")) return;
    try {
      await axios.delete(`/api/settings/delivery-templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error("ลบ template ล้มเหลว", err);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* ฟอร์มสร้าง/แก้ไข template */}
      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "แก้ไข Template" : "สร้าง Template ใหม่"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            placeholder="Branch ID"
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          />
          <Input
            placeholder="Template Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Config (JSON)"
            value={form.config}
            onChange={(e) => setForm({ ...form, config: e.target.value })}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading}>
              {form.id ? "บันทึกการแก้ไข" : "สร้าง Template"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setForm({ branchId: "", name: "", config: "{}" })}
            >
              ล้างฟอร์ม
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ตาราง template */}
      <Card>
        <CardHeader>
          <CardTitle>รายการ Delivery Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Branch ID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Config</th>
                <th className="p-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td className="p-2 border">{t.id}</td>
                  <td className="p-2 border">{t.branchId}</td>
                  <td className="p-2 border">{t.name}</td>
                  <td className="p-2 border">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(t.config, null, 2)}</pre>
                  </td>
                  <td className="p-2 border space-x-2">
                    <Button variant="secondary" onClick={() => handleEdit(t)}>
                      แก้ไข
                    </Button>
                    <Button variant="destructive" onClick={() => handleDelete(t.id)}>
                      ลบ
                    </Button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
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
