"use client";

import MainLayout from "@/layouts/MainLayout";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditStockPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState({
    code: "",
    name: "",
    quantity: 0,
    price: 0,
  });

  // โหลดข้อมูลสินค้า (mock)
  useEffect(() => {
    // TODO: fetch ข้อมูลจาก API `/api/products/${id}`
    // ตัวอย่าง mock data
    setProduct({
      code: "P001",
      name: "สินค้า A",
      quantity: 10,
      price: 100,
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("✏️ อัปเดตสินค้า:", id, product);

    // TODO: เรียก API PUT /api/products/:id
    // const res = await fetch(`http://localhost:5000/api/products/${id}`, {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(product),
    // });
    // if (res.ok) router.push("/stock");

    router.push("/stock"); // กลับไป stock หลังบันทึก
  };

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-6">✏️ แก้ไขสินค้า</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-md">
        <div>
          <label className="block mb-1">รหัสสินค้า</label>
          <input
            type="text"
            value={product.code}
            onChange={(e) => setProduct({ ...product, code: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">ชื่อสินค้า</label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">จำนวน</label>
          <input
            type="number"
            value={product.quantity}
            onChange={(e) => setProduct({ ...product, quantity: Number(e.target.value) })}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">ราคา</label>
          <input
            type="number"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            บันทึกการแก้ไข
          </button>
          <button
            type="button"
            onClick={() => router.push("/stock")}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </MainLayout>
  );
}
