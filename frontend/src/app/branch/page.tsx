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
import Input from "@/components/ui/Input"

interface Branch {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
}

export default function BranchPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  async function fetchBranches() {
    try {
      const res = await axios.get(`${API_URL}/api/branches`);
      setBranches(res.data);
    } catch (err) {
      console.error("โหลดสาขาล้มเหลว", err);
    }
  }

  async function handleAddBranch() {
    if (!form.name) return;
    try {
      await axios.post(`${API_URL}/api/branches`, {
        name: form.name,
        address: form.address,
        phone: form.phone,
      });
      setForm({ name: "", address: "", phone: "" });
      fetchBranches();
    } catch (err) {
      console.error("เพิ่มสาขาล้มเหลว", err);
    }
  }

  async function handleUpdateBranch() {
    if (!editId) return;
    try {
      await axios.put(`${API_URL}/api/branches${editId}`, {
        name: form.name,
        address: form.address,
        phone: form.phone,
      });
      setEditId(null);
      setForm({ name: "", address: "", phone: "" });
      fetchBranches();
    } catch (err) {
      console.error("อัปเดตสาขาล้มเหลว", err);
    }
  }

  async function handleDeleteBranch(id: number) {
    try {
      await axios.delete(`${API_URL}/api/branches${id}`);
      fetchBranches();
    } catch (err) {
      console.error("ลบสาขาล้มเหลว", err);
    }
  }

  function handleEdit(branch: Branch) {
    setEditId(branch.id);
    setForm({
      name: branch.name,
      address: branch.address ?? "",
      phone: branch.phone ?? "",
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* ฟอร์มสาขา */}
      <Card>
        <CardHeader>
          <CardTitle>{editId ? "แก้ไขสาขา" : "เพิ่มสาขาใหม่"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="ชื่อสาขา"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            type="text"
            placeholder="ที่อยู่"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            type="text"
            placeholder="เบอร์โทร"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          {editId ? (
            <div className="flex gap-2">
              <Button onClick={handleUpdateBranch}>บันทึกการแก้ไข</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditId(null);
                  setForm({ name: "", address: "", phone: "" });
                }}
              >
                ยกเลิก
              </Button>
            </div>
          ) : (
            <Button onClick={handleAddBranch}>เพิ่มสาขา</Button>
          )}
        </CardContent>
      </Card>

      {/* ตารางสาขา */}
      <Card>
        <CardHeader>
          <CardTitle>รายการสาขา</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">ชื่อสาขา</th>
                <th className="p-2 border">ที่อยู่</th>
                <th className="p-2 border">เบอร์โทร</th>
                <th className="p-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td className="p-2 border">{b.name}</td>
                  <td className="p-2 border">{b.address}</td>
                  <td className="p-2 border">{b.phone}</td>
                  <td className="p-2 border space-x-2">
                    <Button variant="secondary" onClick={() => handleEdit(b)}>
                      แก้ไข
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteBranch(b.id)}
                    >
                      ลบ
                    </Button>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-2">
                    ไม่มีข้อมูลสาขา
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
