"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface SaleReport {
  id: number;
  branchId: number;
  date: string;
  total: number;
}

interface PurchaseReport {
  id: number;
  supplier: string;
  date: string;
  total: number;
}

interface StockReport {
  branchId: number;
  productId: number;
  quantity: number;
}

export default function ReportPage() {
  const [sales, setSales] = useState<SaleReport[]>([]);
  const [purchases, setPurchases] = useState<PurchaseReport[]>([]);
  const [stocks, setStocks] = useState<StockReport[]>([]);
  const [date, setDate] = useState("");

  async function fetchReports() {
    try {
      const [salesRes, purchaseRes, stockRes] = await Promise.all([
        axios.get("/api/reports/sales", {
          params: { date: date || undefined },
        }),
        axios.get("/api/reports/purchases", {
          params: { date: date || undefined },
        }),
        axios.get("/api/reports/stocks"),
      ]);
      setSales(salesRes.data);
      setPurchases(purchaseRes.data);
      setStocks(stockRes.data);
    } catch (err) {
      console.error("โหลดรายงานล้มเหลว", err);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">รายงาน</h1>

      {/* ฟิลเตอร์วันที่ */}
      <div className="flex gap-2 items-center">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button onClick={fetchReports}>กรอง</Button>
      </div>

      {/* รายงานยอดขาย */}
      <Card>
        <CardHeader>
          <CardTitle>รายงานยอดขาย</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">รหัส</th>
                <th className="p-2 border">สาขา</th>
                <th className="p-2 border">วันที่</th>
                <th className="p-2 border">รวม</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="p-2 border">{s.id}</td>
                  <td className="p-2 border">{s.branchId}</td>
                  <td className="p-2 border">
                    {new Date(s.date).toLocaleDateString("th-TH")}
                  </td>
                  <td className="p-2 border">{s.total}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-2">
                    ไม่มีข้อมูลยอดขาย
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* รายงานการซื้อ */}
      <Card>
        <CardHeader>
          <CardTitle>รายงานการซื้อ</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">รหัส</th>
                <th className="p-2 border">ซัพพลายเออร์</th>
                <th className="p-2 border">วันที่</th>
                <th className="p-2 border">รวม</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td className="p-2 border">{p.id}</td>
                  <td className="p-2 border">{p.supplier}</td>
                  <td className="p-2 border">
                    {new Date(p.date).toLocaleDateString("th-TH")}
                  </td>
                  <td className="p-2 border">{p.total}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-2">
                    ไม่มีข้อมูลการซื้อ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* รายงานสต็อก */}
      <Card>
        <CardHeader>
          <CardTitle>รายงานสต็อก</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">สาขา</th>
                <th className="p-2 border">สินค้า</th>
                <th className="p-2 border">จำนวน</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">{s.branchId}</td>
                  <td className="p-2 border">{s.productId}</td>
                  <td className="p-2 border">{s.quantity}</td>
                </tr>
              ))}
              {stocks.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center p-2">
                    ไม่มีข้อมูลสต็อก
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
