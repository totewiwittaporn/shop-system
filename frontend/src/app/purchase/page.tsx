"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select, { SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

interface PurchaseLine {
  productId: number;
  quantity: number;
  unitCost: number;
  deliveryStockType: "NORMAL" | "CONSIGNMENT";
}

export default function PurchasePage() {
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    branchId: "",
    supplierId: "",
    lines: [{ productId: "", quantity: "", unitCost: "", deliveryStockType: "NORMAL" }],
  });

  useEffect(() => {
    fetchBranches();
    fetchProducts();
  }, []);

  async function fetchBranches() {
    const res = await axios.get("/api/branches");
    setBranches(res.data);
  }

  async function fetchProducts() {
    const res = await axios.get("/api/products");
    setProducts(res.data);
  }

  function handleLineChange(index: number, field: string, value: string) {
    const newLines = [...form.lines];
    (newLines[index] as any)[field] = value;
    setForm({ ...form, lines: newLines });
  }

  function addLine() {
    setForm({
      ...form,
      lines: [...form.lines, { productId: "", quantity: "", unitCost: "", deliveryStockType: "NORMAL" }],
    });
  }

  async function handleAddPurchase() {
    if (!form.branchId || !form.supplierId) return;

    await axios.post("/api/purchases", {
      branchId: Number(form.branchId),
      supplierId: Number(form.supplierId),
      items: form.lines.map((l) => ({
        productId: Number(l.productId),
        orderedQty: Number(l.quantity),
        usableQty: Number(l.quantity),
        unitCost: Number(l.unitCost),
        totalCost: Number(l.quantity) * Number(l.unitCost),
        stockLocation: l.deliveryStockType === "NORMAL" ? "MAIN" : "CONSIGN",
      })),
    });

    setForm({ branchId: "", supplierId: "", lines: [{ productId: "", quantity: "", unitCost: "", deliveryStockType: "NORMAL" }] });
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>สร้างการซื้อสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={form.branchId} onValueChange={(val) => setForm({ ...form, branchId: val })}>
            <SelectTrigger><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={form.supplierId} onValueChange={(val) => setForm({ ...form, supplierId: val })}>
            <SelectTrigger><SelectValue placeholder="เลือกซัพพลายเออร์" /></SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {form.lines.map((line, idx) => (
            <div key={idx} className="flex gap-2">
              <Select value={line.productId.toString()} onValueChange={(val) => handleLineChange(idx, "productId", val)}>
                <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <input type="number" placeholder="จำนวน" value={line.quantity} onChange={(e) => handleLineChange(idx, "quantity", e.target.value)} />
              <input type="number" placeholder="ราคาต่อหน่วย" value={line.unitCost} onChange={(e) => handleLineChange(idx, "unitCost", e.target.value)} />

              <Select value={line.deliveryStockType} onValueChange={(val) => handleLineChange(idx, "deliveryStockType", val)}>
                <SelectTrigger><SelectValue placeholder="ประเภทสต็อก" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">NORMAL</SelectItem>
                  <SelectItem value="CONSIGNMENT">CONSIGNMENT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={addLine}>+ เพิ่มสินค้า</Button>
            <Button onClick={handleAddPurchase}>บันทึกการซื้อ</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
