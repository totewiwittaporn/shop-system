"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select, { SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

interface Stock {
  branchId: number;
  productId: number;
  quantity: number;
  stockLocation: string;
  branchName: string;
  productName: string;
}

export default function StockPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [form, setForm] = useState({ branchId: "", productId: "", quantity: "", stockLocation: "MAIN" });
  const [editId, setEditId] = useState<number | null>(null);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetchStocks();
    fetchProducts();
    fetchBranches();
  }, []);

  async function fetchStocks() {
    const res = await axios.get("/api/stocks");
    setStocks(res.data);
  }

  async function fetchProducts() {
    const res = await axios.get("/api/products");
    setProducts(res.data);
  }

  async function fetchBranches() {
    const res = await axios.get("/api/branches");
    setBranches(res.data);
  }

  async function handleAddStock() {
    await axios.post("/api/stocks", {
      ...form,
      branchId: Number(form.branchId),
      productId: Number(form.productId),
    });
    setForm({ branchId: "", productId: "", quantity: "", stockLocation: "MAIN" });
    fetchStocks();
  }

  async function handleUpdateStock(stock: Stock) {
    await axios.put(`/api/stocks/${stock.branchId}/${stock.productId}/${stock.stockLocation}`, {
      quantity: Number(form.quantity),
    });
    setEditId(null);
    setForm({ branchId: "", productId: "", quantity: "", stockLocation: "MAIN" });
    fetchStocks();
  }

  function handleEdit(stock: Stock) {
    setEditId(stock.productId);
    setForm({
      branchId: String(stock.branchId),
      productId: String(stock.productId),
      quantity: String(stock.quantity),
      stockLocation: stock.stockLocation,
    });
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editId ? "แก้ไขสต็อก" : "เพิ่มสต็อก"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={form.branchId} onValueChange={(val) => setForm({ ...form, branchId: val })}>
            <SelectTrigger><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={form.productId} onValueChange={(val) => setForm({ ...form, productId: val })}>
            <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
            <SelectContent>
              {products.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={form.stockLocation} onValueChange={(val) => setForm({ ...form, stockLocation: val })}>
            <SelectTrigger><SelectValue placeholder="เลือกประเภทสต็อก" /></SelectTrigger>
            <SelectContent>
              {["MAIN", "BRANCH", "CONSIGN"].map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
            </SelectContent>
          </Select>

          <input
            type="number"
            placeholder="จำนวน"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />

          {editId ? (
            <div className="flex gap-2">
              <Button onClick={() => handleUpdateStock(stocks.find((s) => s.productId === editId)!)}>บันทึก</Button>
              <Button variant="secondary" onClick={() => setEditId(null)}>ยกเลิก</Button>
            </div>
          ) : (
            <Button onClick={handleAddStock}>เพิ่มสต็อก</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการสต็อก</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">สาขา</th>
                <th className="p-2 border">สินค้า</th>
                <th className="p-2 border">ประเภทสต็อก</th>
                <th className="p-2 border">จำนวน</th>
                <th className="p-2 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={`${s.branchId}-${s.productId}-${s.stockLocation}`}>
                  <td className="p-2 border">{s.branchName}</td>
                  <td className="p-2 border">{s.productName}</td>
                  <td className="p-2 border">{s.stockLocation}</td>
                  <td className="p-2 border">{s.quantity}</td>
                  <td className="p-2 border space-x-2">
                    <Button variant="secondary" onClick={() => handleEdit(s)}>แก้ไข</Button>
                  </td>
                </tr>
              ))}
              {stocks.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-2">ไม่มีข้อมูลสต็อก</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
