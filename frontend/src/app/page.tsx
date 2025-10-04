"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function LandingPage() {
  const router = useRouter();

  const [inputVal, setInputVal] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [page, setPage] = useState(1);
  const [selectVal, setSelectVal] = useState("1");

  const tableHeaders = ["ชื่อสินค้า", "ราคา", "จำนวน"];
  const tableData = [
    ["สินค้า A", 100, 5],
    ["สินค้า B", 200, 2],
    ["สินค้า C", 150, 8],
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] p-6">
      {/* โลโก้หรือชื่อระบบ */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-500">
          Chalin Shop System
        </h1>
        <p className="text-gray-100 mt-2">
          ระบบจัดการร้านค้าและฝากขายที่ใช้งานง่ายที่สุด
        </p>
      </div>

        {/* คำถามหลัก */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-400">
            คุณเป็นสมาชิกของเราแล้วหรือยัง?
          </h2>

          {/* ปุ่ม action */}
          <div className="space-y-4">
            <Button 
            onClick={() => router.push("/login")} 
            variant="primary"
            fullWidth>
              เข้าสู่ระบบ
            </Button>
            <br />

            <Button 
            onClick={() => router.push("/register")} 
            variant="success"
            fullWidth>
              สมัครสมาชิกใหม่
            </Button>
          </div>
        </div>
    
      {/* footer */}
      <footer className="mt-12 text-sm text-gray-400">
        © {new Date().getFullYear()} Chalin Shop System. All rights reserved.
      </footer>
    </main>
  );
}
