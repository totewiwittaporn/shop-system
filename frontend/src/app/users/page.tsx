"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select"

interface User {
  id: number;
  username: string;
  role: "ADMIN" | "STAFF";
}

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "STAFF",
  });
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await axios.get(`/api/users`);
      setUsers(res.data);
    } catch (err) {
      console.error("โหลดผู้ใช้ล้มเหลว", err);
    }
  }

  async function handleAddUser() {
    if (!form.username || !form.password) return;
    try {
      await axios.post("/api/users", form);
      setForm({ username: "", password: "", role: "STAFF" });
      fetchUsers();
    } catch (err) {
      console.error("เพิ่มผู้ใช้ล้มเหลว", err);
    }
  }

  async function handleUpdateUser() {
    if (!editId) return;
    try {
      await axios.put(`/api/users/${editId}`, {
        username: form.username,
        role: form.role,
      });
      setEditId(null);
      setForm({ username: "", password: "", role: "STAFF" });
      fetchUsers();
    } catch (err) {
      console.error("อัปเดตผู้ใช้ล้มเหลว", err);
    }
  }

  async function handleDeleteUser(id: number) {
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("ลบผู้ใช้ล้มเหลว", err);
    }
  }

  function handleEdit(user: User) {
    setEditId(user.id);
    setForm({
      username: user.username,
      password: "",
      role: user.role,
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* ฟอร์มผู้ใช้ */}
      <Card>
        <CardHeader>
          <CardTitle>{editId ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="ชื่อผู้ใช้"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          {!editId && (
            <Input
              type="password"
              placeholder="รหัสผ่าน"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}
          <Select
            value={form.role}
            onValueChange={(val) => setForm({ ...form, role: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือก Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="STAFF">STAFF</SelectItem>
            </SelectContent>
          </Select>

          {editId ? (
            <div className="flex gap-2">
              <Button onClick={handleUpdateUser}>บันทึกการแก้ไข</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditId(null);
                  setForm({ username: "", password: "", role: "STAFF" });
                }}
              >
                ยกเลิก
              </Button>
            </div>
          ) : (
            <Button onClick={handleAddUser}>เพิ่มผู้ใช้</Button>
          )}
        </CardContent>
      </Card>

      {/* ตารางผู้ใช้ */}
      <Card>
        <CardHeader>
          <CardTitle>รายการผู้ใช้</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">ชื่อผู้ใช้</th>
                <th className="p-2 border">สิทธิ์</th>
                <th className="p-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-2 border">{u.username}</td>
                  <td className="p-2 border">{u.role}</td>
                  <td className="p-2 border space-x-2">
                    <Button variant="secondary" onClick={() => handleEdit(u)}>
                      แก้ไข
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      ลบ
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center p-2">
                    ไม่มีข้อมูลผู้ใช้
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
