"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface DashboardSummary {
  totalSales: number;
  totalPurchases: number;
  totalProducts: number;
  totalBranches: number;
}

interface TopProduct {
  product: string;
  quantity: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  async function fetchDashboard() {
    setLoading(true);
    try {
      // Dashboard Orders Daily & Stock
      const [ordersRes, stockRes] = await Promise.all([
        api.get(`${API_URL}/api/dashboards/orders/daily`),
        api.get(`${API_URL}/api/dashboards/stock/branches`),
      ]);
      console.log("Orders Daily:", ordersRes.data);
      console.log("Stock by Branch:", stockRes.data);

      // Dashboard Summary & Top Products
      const [summaryRes, topRes] = await Promise.all([
        api.get(`${API_URL}/api/dashboards/summary`),
        api.get(`${API_URL}/api/dashboards/top-products`),
      ]);

      setSummary(summaryRes.data);
      setTopProducts(topRes.data);
    } catch (err) {
      console.error("โหลด Dashboard ล้มเหลว", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <>
          {/* สรุปข้อมูลหลัก */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>ยอดขายรวม</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-bold">
                {summary?.totalSales ?? 0} บาท
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ยอดซื้อรวม</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-bold">
                {summary?.totalPurchases ?? 0} บาท
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>จำนวนสินค้า</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-bold">
                {summary?.totalProducts ?? 0} รายการ
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>จำนวนสาขา</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-bold">
                {summary?.totalBranches ?? 0} สาขา
              </CardContent>
            </Card>
          </div>

          {/* สินค้าขายดี */}
          <Card>
            <CardHeader>
              <CardTitle>สินค้าขายดี</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">สินค้า</th>
                    <th className="p-2 border">จำนวนที่ขาย</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border">{p.product}</td>
                      <td className="p-2 border">{p.quantity}</td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center p-2">
                        ไม่มีข้อมูล
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
