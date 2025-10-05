// app/settings/consignedProducts/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
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

type Product = { id: number; name: string };
type ConsignmentShop = { id: number; name: string };

type ConsignedProduct = {
  id: number;
  shopId: number;
  productId: number;
  price: number;
  active: boolean;
};

function pickArray<T = any>(data: any, keys: string[]): T[] {
  if (Array.isArray(data)) return data;
  for (const k of keys) {
    const v = data?.[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

const toPosInt = (v: string | number | undefined | null) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export default function ConsignedProductsPage() {
  // masters
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<ConsignmentShop[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(false);

  // list
  const [consignedProducts, setConsignedProducts] = useState<ConsignedProduct[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // form state
  const [shopIdStr, setShopIdStr] = useState<string>("");
  const [productIdStr, setProductIdStr] = useState<string>("");
  const [priceStr, setPriceStr] = useState<string>("0");
  const [active, setActive] = useState<boolean>(true);

  // editing
  const [editingId, setEditingId] = useState<number | null>(null);

  const canSubmit = useMemo(() => {
    const sid = toPosInt(shopIdStr);
    const pid = toPosInt(productIdStr);
    const price = Number(priceStr);
    return sid > 0 && pid > 0 && Number.isFinite(price) && price >= 0;
  }, [shopIdStr, productIdStr, priceStr]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingMasters(true);
        const [pRes, sRes] = await Promise.all([
          axios.get("/api/settings/products", { params: { pageSize: 500 } }),
          // ดึงเฉพาะร้านฝากขาย
          axios.get("/api/settings/shops", { params: { type: "consignment", pageSize: 200 } }),
        ]);
        setProducts(
          pickArray(pRes.data, ["items", "products"]).map((p: any) => ({
            id: p.id,
            name: p.name ?? p.productName ?? `#${p.id}`,
          }))
        );
        setShops(
          pickArray(sRes.data, ["items", "shops"]).map((s: any) => ({
            id: s.id,
            name: s.name,
          }))
        );
      } catch (e) {
        console.error("Load masters failed:", e);
      } finally {
        setLoadingMasters(false);
      }
    })();
  }, []);

  const fetchList = async () => {
    try {
      setLoadingList(true);
      // ⚠ เลือกให้ตรง backend ของเรา: /api/v1/consigned-products
      const res = await axios.get("/api/v1/consigned-products", {
        params: { pageSize: 500 },
      });
      // รองรับทั้ง {data:[...]} และ {items:[...]}
      const rows = pickArray(res.data, ["data", "items"]).map((r: any) => ({
        id: r.id,
        shopId: r.shopId,
        productId: r.productId,
        price: r.price,
        active: r.active ?? true,
      }));
      setConsignedProducts(rows);
    } catch (e) {
      console.error("Load consigned products failed:", e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  function resetForm() {
    setEditingId(null);
    setShopIdStr("");
    setProductIdStr("");
    setPriceStr("0");
    setActive(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      return alert("กรุณาเลือกร้าน/สินค้า และระบุราคาให้ถูกต้อง");
    }
    const payload = {
      shopId: toPosInt(shopIdStr),
      productId: toPosInt(productIdStr),
      price: Number(priceStr),
      active,
    };

    try {
      if (editingId) {
        await axios.put(`/api/v1/consigned-products/${editingId}`, payload);
      } else {
        await axios.post("/api/v1/consigned-products", payload);
      }
      await fetchList();
      resetForm();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.response?.data?.error || e.message || "บันทึกล้มเหลว");
      console.error("Save consigned product error:", e);
    }
  }

  function handleEdit(cp: ConsignedProduct) {
    setEditingId(cp.id);
    setShopIdStr(String(cp.shopId));
    setProductIdStr(String(cp.productId));
    setPriceStr(String(cp.price ?? 0));
    setActive(!!cp.active);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: number) {
    if (!confirm("คุณต้องการลบรายการนี้หรือไม่?")) return;
    try {
      await axios.delete(`/api/v1/consigned-products/${id}`);
      await fetchList();
      if (editingId === id) resetForm();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.response?.data?.error || e.message || "ลบรายการล้มเหลว");
      console.error("Delete consigned product error:", e);
    }
  }

  const shopName = (id: number) => shops.find((s) => s.id === id)?.name ?? `Shop #${id}`;
  const productName = (id: number) => products.find((p) => p.id === id)?.name ?? `#${id}`;

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>กำหนดสินค้าฝากขาย (ต่อร้าน ↔ สินค้า ↔ ราคา)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shop */}
            <div className="space-y-1">
              <div className="text-sm font-medium">เลือกร้านฝากขาย</div>
              <Select value={shopIdStr} onValueChange={setShopIdStr}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingMasters ? "กำลังโหลดร้าน…" : "เลือกร้าน"} />
                </SelectTrigger>
                <SelectContent>
                  {shops.length ? (
                    shops.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">กำลังโหลด…</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Product */}
            <div className="space-y-1">
              <div className="text-sm font-medium">เลือกสินค้า</div>
              <Select value={productIdStr} onValueChange={setProductIdStr}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingMasters ? "กำลังโหลดสินค้า…" : "เลือกสินค้า"} />
                </SelectTrigger>
                <SelectContent>
                  {products.length ? (
                    products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">กำลังโหลด…</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="text-sm font-medium">ราคาฝากขาย</div>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="ราคา"
              />
            </div>

            {/* Active */}
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span className="text-sm">เปิดใช้งาน (Active)</span>
            </label>

            <div className="flex items-end gap-2">
              <Button type="submit" disabled={!canSubmit}>
                {editingId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  ยกเลิกแก้ไข
                </Button>
              )}
            </div>
          </form>

          {/* List */}
          <div className="space-y-2">
            {loadingList ? (
              <div className="text-sm text-gray-500">กำลังโหลดรายการ…</div>
            ) : consignedProducts.length ? (
              consignedProducts.map((cp) => (
                <div
                  key={cp.id}
                  className="flex justify-between items-center border rounded-md px-3 py-2"
                >
                  <div>
                    <div className="font-medium">{productName(cp.productId)}</div>
                    <div className="text-xs text-gray-500">
                      ร้าน: {shopName(cp.shopId)} • ราคา: {cp.price.toLocaleString()} •{" "}
                      สถานะ: {cp.active ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(cp)}>
                      แก้ไข
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(cp.id)}>
                      ลบ
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">ยังไม่มีรายการ</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
