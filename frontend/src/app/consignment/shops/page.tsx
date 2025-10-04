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

interface Shop {
  id: number;
  name: string;
  display: string | null;
  contact: string | null;
}

export default function ConsignmentShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [form, setForm] = useState({
    name: "",
    display: "",
    contact: "",
  });
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchShops();
  }, []);

  async function fetchShops() {
    try {
      const res = await axios.get("/api/consignments/shops");
      setShops(res.data);
    } catch (err) {
      console.error("โหลดร้านคู่ค้าล้มเหลว", err);
    }
  }

  async function handleAddShop() {
    if (!form.name) return;
    try {
      await axios.post("/api/consignments/shops", {
        name: form.name,
        display: form.display,
        contact: form.contact,
      });
      setForm({ name: "", display: "", contact: "" });
      fetchShops();
    } catch (err) {
      console.error("เพิ่มร้านคู่ค้าล้มเหลว", err);
    }
  }

  async function handleUpdateShop() {
    if (!editId) return;
    try {
      await axios.put(`/api/consignments/shops/${editId}`, {
        name: form.name,
        display: form.display,
        contact: form.contact,
      });
      setEditId(null);
      setForm({ name: "", display: "", contact: "" });
      fetchShops();
    } catch (err) {
      console.error("อัปเดตร้านคู่ค้าล้มเหลว", err);
    }
  }

  async function handleDeleteShop(id: number) {
    try {
      await axios.delete(`/api/consignments/shops/${id}`);
      fetchShops();
    } catch (err) {
      console.error("ลบร้านคู่ค้าล้มเหลว", err);
    }
  }

  function handleEdit(shop: Shop) {
    setEditId(shop.id);
    setForm({
      name: shop.name,
      display: shop.display ?? "",
      contact: shop.contact ?? "",
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* ฟอร์มร้านคู่ค้า */}
      <Card>
        <CardHeader>
          <CardTitle>{editId ? "แก้ไขร้านคู่ค้า" : "เพิ่มร้านคู่ค้าใหม่"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="ชื่อ (system name)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            type="text"
            placeholder="ชื่อแสดงผล (display)"
            value={form.display}
            onChange={(e) => setForm({ ...form, display: e.target.value })}
          />
          <Input
            type="text"
            placeholder="ข้อมูลติดต่อ"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />

          {editId ? (
            <div className="flex gap-2">
              <Button onClick={handleUpdateShop}>บันทึกการแก้ไข</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditId(null);
                  setForm({ name: "", display: "", contact: "" });
                }}
              >
                ยกเลิก
              </Button>
            </div>
          ) : (
            <Button onClick={handleAddShop}>เพิ่มร้านคู่ค้า</Button>
          )}
        </CardContent>
      </Card>

      {/* ตารางร้านคู่ค้า */}
      <Card>
        <CardHeader>
          <CardTitle>รายการร้านคู่ค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">ชื่อ (system)</th>
                <th className="p-2 border">ชื่อแสดงผล</th>
                <th className="p-2 border">ติดต่อ</th>
                <th className="p-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id}>
                  <td className="p-2 border">{s.name}</td>
                  <td className="p-2 border">{s.display}</td>
                  <td className="p-2 border">{s.contact}</td>
                  <td className="p-2 border space-x-2">
                    <Button variant="secondary" onClick={() => handleEdit(s)}>
                      แก้ไข
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteShop(s.id)}
                    >
                      ลบ
                    </Button>
                  </td>
                </tr>
              ))}
              {shops.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-2">
                    ไม่มีข้อมูลร้านคู่ค้า
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
