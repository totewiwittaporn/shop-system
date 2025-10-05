// frontend/app/stock/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/Select";

type Branch = { id: number; name: string };
type Row = {
  branchId: number;
  productId: number;
  quantity: number;
  branch?: { id: number; name: string };
  branchProduct?: { product?: { id: number; name?: string; sku?: string; barcode?: string } };
};

const toPosInt = (v: string | number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };

export default function StockViewerPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadBranches(); }, []);
  useEffect(() => { load(); }, [branchId, search]);

  async function loadBranches() {
    try {
      const res = await axios.get<any>("/api/settings/branches", { params: { pageSize: 200 } });
      const arr = Array.isArray(res.data) ? res.data : res.data.items ?? res.data.branches ?? [];
      // ให้ Chalin Shop ขึ้นก่อน
      const sorted = arr.sort((a: any, b: any) => (a.name === "Chalin Shop" ? -1 : b.name === "Chalin Shop" ? 1 : a.name.localeCompare(b.name)));
      setBranches(sorted.map((b: any) => ({ id: b.id, name: b.name })));
    } catch {}
  }

  async function load() {
    try {
      setLoading(true);
      const res = await axios.get<Row[]>("/api/stocks", {
        params: {
          branchId: toPosInt(branchId) || undefined,
          search: search || undefined,
        },
      });
      setRows(res.data);
    } finally { setLoading(false); }
  }

  const total = useMemo(() => rows.reduce((s, r) => s + (r.quantity || 0), 0), [rows]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader><CardTitle>สต็อกคงเหลือ (สาขา)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">สาขา</div>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <div className="text-sm font-medium">ค้นหา (ชื่อ/รหัส/บาร์โค้ด)</div>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="พิมพ์อย่างน้อย 2 ตัวอักษร"/>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 border">Product</th>
                  <th className="p-2 border w-32">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const p = r.branchProduct?.product;
                  return (
                    <tr key={`${r.branchId}-${r.productId}`}>
                      <td className="p-2 border">
                        {p?.name ?? `#${r.productId}`}
                        <div className="text-xs text-gray-500">
                          ID: {p?.id ?? r.productId}{p?.sku ? ` • SKU: ${p.sku}` : ""}{p?.barcode ? ` • BARCODE: ${p.barcode}` : ""}
                        </div>
                      </td>
                      <td className="p-2 border text-right">{r.quantity}</td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr><td className="p-3 text-center text-gray-500" colSpan={2}>ไม่มีข้อมูล</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td className="p-2 border text-right font-medium">รวม</td>
                  <td className="p-2 border text-right font-bold">{total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
