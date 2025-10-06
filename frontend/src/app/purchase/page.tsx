"use client";

import { useEffect, useMemo, useState } from "react";
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

/* ========== Types ========== */
type Branch = { id: number; name: string };
type Supplier = { id: number; name: string };
type Product = { id: number; name: string };

type PurchaseLineInput = {
  productId: number;
  orderedQty: number;
  usableQty: number;
  defectQty: number;
  unitCost: number;
  totalCost?: number; // จะคำนวณให้อัตโนมัติถ้าไม่ส่งมา
  StockLocation: "MAIN" | "CONSIGN"; // map เป็น enum ฝั่ง DB แล้ว
};

type PurchaseLineFromAPI = {
  id?: number;
  productId: number;
  orderedQty: number;
  receivedQty?: number | null;
  usableQty: number;
  defectQty: number;
  unitCost: number;
  totalCost: number;
  StockLocation: "MAIN" | "CONSIGN";
};

type PurchaseRow = {
  id: number;
  supplierId: number;
  branchId: number | null;
  status: "PENDING" | "CONFIRMED" | "CANCELED" | string;
  createdAt: string;
  updatedAt: string;
  docDate?: string;
  supplier?: Supplier;
  branch?: Branch | null;
  // backend อาจชื่อ lines หรือ items → รองรับทั้งคู่
  lines?: PurchaseLineFromAPI[];
  items?: PurchaseLineFromAPI[];
};

/* ========== Helpers ========== */
const toPosInt = (v: string | number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const money = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("th-TH", { minimumFractionDigits: 2 })
    : "-";

/* ========== Page ========== */
export default function PurchasePage() {
  /* masters */
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  /* form state (ใช้ undefined เพื่อไม่ให้ Select ส่งค่า "" ซึ่งผิดกติกา) */
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined);
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [stockLoc, setStockLoc] = useState<"MAIN" | "CONSIGN">("MAIN");

  const [lines, setLines] = useState<PurchaseLineInput[]>([
    {
      productId: 0,
      orderedQty: 0,
      usableQty: 0,
      defectQty: 0,
      unitCost: 0,
      StockLocation: "MAIN",
    },
  ]);

  /* pending list filters */
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  /* list + loading flags */
  const [pending, setPending] = useState<PurchaseRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* derived */
  const canCreate = useMemo(() => {
    const sid = toPosInt(supplierId || 0);
    if (!sid) return false;
    if (!lines.length) return false;
    return lines.every(
      (l) =>
        toPosInt(l.productId) > 0 &&
        toPosInt(l.orderedQty) > 0 &&
        toPosInt(l.usableQty) >= 0 &&
        toPosInt(l.defectQty) >= 0 &&
        Number.isFinite(Number(l.unitCost))
    );
  }, [supplierId, lines]);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const [b, s, p] = await Promise.all([
          axios.get<any>("/api/settings/branches", {
            params: { pageSize: 200 },
          }),
          axios.get<any>("/api/settings/suppliers", {
            params: { pageSize: 200 },
          }),
          axios.get<any>("/api/products", { params: { pageSize: 500 } }),
        ]);

        const branchArr = Array.isArray(b.data)
          ? b.data
          : b.data.items ?? b.data.branches ?? [];
        const suppArr = Array.isArray(s.data)
          ? s.data
          : s.data.items ?? s.data.suppliers ?? [];
        const prodArr = Array.isArray(p.data)
          ? p.data
          : p.data.items ?? p.data.products ?? [];

        setBranches(branchArr.map((x: any) => ({ id: x.id, name: x.name })));
        setSuppliers(suppArr.map((x: any) => ({ id: x.id, name: x.name })));
        setProducts(prodArr.map((x: any) => ({ id: x.id, name: x.name })));
      } catch (e: any) {
        setErr(
          e?.response?.data?.error || e.message || "โหลดข้อมูลหลักล้มเหลว"
        );
      }
    })();
  }, []);

  useEffect(() => {
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPending() {
    try {
      setBusy(true);
      setErr(null);
      const res = await axios.get<PurchaseRow[]>("/api/purchases", {
        params: {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      });
      setPending(res.data);
    } catch (e: any) {
      setErr(
        e?.response?.data?.error || e.message || "โหลดรายการรอรับเข้าไม่สำเร็จ"
      );
    } finally {
      setBusy(false);
    }
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        productId: 0,
        orderedQty: 0,
        usableQty: 0,
        defectQty: 0,
        unitCost: 0,
        StockLocation: stockLoc,
      },
    ]);
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateLine(i: number, field: keyof PurchaseLineInput, val: string) {
    setLines((prev) => {
      const arr = [...prev];
      if (field === "StockLocation") {
        arr[i].StockLocation = (val as any) === "CONSIGN" ? "CONSIGN" : "MAIN";
      } else if (
        ["productId", "orderedQty", "usableQty", "defectQty"].includes(field)
      ) {
        (arr[i] as any)[field] = toPosInt(val);
      } else if (field === "unitCost") {
        (arr[i] as any)[field] = Number(val);
      }
      return arr;
    });
  }

  async function createPurchase() {
    if (!canCreate)
      return alert(
        "กรอกข้อมูลให้ครบ: ผู้ขาย + รายการ (productId/orderedQty/unitCost)"
      );
    try {
      setBusy(true);
      const payload = {
        supplierId: toPosInt(supplierId || 0),
        branchId: branchId ? toPosInt(branchId) : null,
        items: lines.map((l) => ({
          productId: toPosInt(l.productId),
          orderedQty: toPosInt(l.orderedQty),
          // ถ้าไม่ส่ง receivedQty backend จะตั้ง = orderedQty เอง
          usableQty: toPosInt(l.usableQty),
          defectQty: toPosInt(l.defectQty),
          unitCost: Number(l.unitCost),
          // ถ้าไม่ส่ง totalCost backend จะคำนวณ unitCost*usableQty เอง
          StockLocation: l.StockLocation, // "MAIN" | "CONSIGN"
        })),
      };
      await axios.post("/api/purchases", payload);
      // reset
      setLines([
        {
          productId: 0,
          orderedQty: 0,
          usableQty: 0,
          defectQty: 0,
          unitCost: 0,
          StockLocation: stockLoc,
        },
      ]);
      alert("สร้างใบซื้อสำเร็จ");
      await loadPending();
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message || "สร้างใบซื้อไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(id: number) {
    if (!window.confirm("ยืนยันรับสินค้าเข้าคลัง?")) return;
    try {
      setBusy(true);
      await axios.post(`/api/purchases/${id}/confirm`);
      await loadPending();
      alert("รับสินค้าเข้าคลังแล้ว");
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message || "ยืนยันรับเข้าไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  /* utils */
  const supplierName = (id?: number) =>
    id ? suppliers.find((s) => s.id === id)?.name ?? `Supplier #${id}` : "-";
  const branchName = (id?: number | null) =>
    id ? branches.find((b) => b.id === id)?.name ?? `Branch #${id}` : "-";

  return (
    <div className="p-6 space-y-6">
      {/* สร้างใบซื้อ */}
      <Card>
        <CardHeader>
          <CardTitle>สร้างใบซื้อสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* supplier */}
            <div className="space-y-1">
              <div className="text-sm font-medium">ผู้ขาย</div>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      suppliers.length ? "เลือกผู้ขาย" : "กำลังโหลดผู้ขาย…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.length ? (
                    suppliers.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      กำลังโหลด…
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* branch (optional) */}
            <div className="space-y-1">
              <div className="text-sm font-medium">สาขาปลายทาง</div>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      branches.length
                        ? "เลือกสาขา (ไม่บังคับ)"
                        : "กำลังโหลดสาขา…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {branches.length ? (
                    branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      กำลังโหลด…
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* default stock location for new rows */}
            <div className="space-y-1">
              <div className="text-sm font-medium">เข้าคลัง</div>
              <Select
                value={stockLoc}
                onValueChange={(v) => {
                  const vv = (v as any) === "CONSIGN" ? "CONSIGN" : "MAIN";
                  setStockLoc(vv);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกคลังปลายทาง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIN">MAIN (คลังสาขา)</SelectItem>
                  <SelectItem value="CONSIGN">CONSIGN (คลังฝากขาย)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* lines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">รายการสินค้า</div>
              <Button variant="secondary" onClick={addLine}>
                + เพิ่มบรรทัด
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 border w-16">#</th>
                    <th className="p-2 border w-28">สินค้า</th>
                    <th className="p-2 border w-28">สั่งซื้อ</th>
                    <th className="p-2 border w-28">ใช้ได้</th>
                    <th className="p-2 border w-28">เสียหาย</th>
                    <th className="p-2 border w-32">ต้นทุน/หน่วย</th>
                    <th className="p-2 border w-40">เข้าคลัง</th>
                    <th className="p-2 border w-28">ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td className="p-2 border text-center">{i + 1}</td>
                      <td className="p-2 border">
                        <Select
                          value={l.productId ? String(l.productId) : undefined}
                          onValueChange={(v) => updateLine(i, "productId", v)}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                products.length
                                  ? "เลือกสินค้า"
                                  : "กำลังโหลดสินค้า…"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {products.length ? (
                              products.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                  {p.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                กำลังโหลด…
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 border">
                        <Input
                          type="number"
                          value={l.orderedQty}
                          onChange={(e) =>
                            updateLine(i, "orderedQty", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border">
                        <Input
                          type="number"
                          value={l.usableQty}
                          onChange={(e) =>
                            updateLine(i, "usableQty", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border">
                        <Input
                          type="number"
                          value={l.defectQty}
                          onChange={(e) =>
                            updateLine(i, "defectQty", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border">
                        <Input
                          type="number"
                          value={l.unitCost}
                          onChange={(e) =>
                            updateLine(i, "unitCost", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border">
                        <Select
                          value={l.StockLocation}
                          onValueChange={(v) =>
                            updateLine(i, "StockLocation", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกคลัง" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MAIN">MAIN</SelectItem>
                            <SelectItem value="CONSIGN">CONSIGN</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 border text-center">
                        <Button
                          variant="destructive"
                          onClick={() => removeLine(i)}
                        >
                          ลบ
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!lines.length && (
                    <tr>
                      <td className="p-3 text-center text-gray-500" colSpan={8}>
                        ยังไม่มีรายการ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={createPurchase} disabled={busy || !canCreate}>
                บันทึกใบซื้อ
              </Button>
              {err && <span className="text-sm text-red-600">{err}</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* pending list */}
      <Card>
        <CardHeader>
          <CardTitle>รายการคำสั่งซื้อทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <div className="text-sm font-medium">จากวันที่</div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <div className="text-sm font-medium">ถึงวันที่</div>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadPending} disabled={busy}>
                โหลดซ้ำ
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 border w-16">ID</th>
                  <th className="p-2 border">ซัพพลายเออร์</th>
                  <th className="p-2 border">สาขาปลายทาง</th>
                  <th className="p-2 border">วันที่</th>
                  <th className="p-2 border">สถานะ</th>
                  <th className="p-2 border">ยอดรวม</th>
                  <th className="p-2 border w-40">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p) => {
                  const arr = (p.lines ??
                    p.items ??
                    []) as PurchaseLineFromAPI[];
                  const total = arr.reduce(
                    (s, l) => s + (Number(l.totalCost) || 0),
                    0
                  );
                  const dt = p.docDate || p.createdAt;
                  return (
                    <tr key={p.id}>
                      <td className="p-2 border text-center">{p.id}</td>
                      <td className="p-2 border">
                        {supplierName(p.supplierId)}
                      </td>
                      <td className="p-2 border">{branchName(p.branchId)}</td>
                      <td className="p-2 border">
                        {new Date(dt).toLocaleString("th-TH")}
                      </td>
                      <td className="p-2 border text-center">
                        {p.status === "PENDING" && (
                          <span className="text-yellow-600 font-medium">
                            รอรับเข้า
                          </span>
                        )}
                        {p.status === "RECEIVED" && (
                          <span className="text-green-600 font-medium">
                            รับเข้าแล้ว
                          </span>
                        )}
                        {p.status === "CANCELED" && (
                          <span className="text-red-600 font-medium">
                            ยกเลิก
                          </span>
                        )}
                      </td>
                      <td className="p-2 border">{money(total)}</td>
                      <td className="p-2 border text-center">
                        {p.status === "PENDING" && (
                          <Button
                            variant="secondary"
                            onClick={() => confirm(p.id)}
                            disabled={busy}
                          >
                            ยืนยันรับเข้า
                          </Button>
                        )}
                        {p.status === "RECEIVED" && (
                          <span className="text-green-700">เสร็จสิ้น</span>
                        )}
                        {p.status === "CANCELED" && (
                          <span className="text-gray-500">ยกเลิกแล้ว</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!pending.length && (
                  <tr>
                    <td className="p-3 text-center text-gray-500" colSpan={6}>
                      ไม่มีรายการรอรับเข้า
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
