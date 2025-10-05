// frontend/app/stock-count/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import axios from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

type Branch = { id: number; name: string };
type CountLine = { productId: number; countedQty: number; name?: string; barcode?: string };

const toPosInt = (v: string | number) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };

// กล้อง: ใช้ BarcodeDetector ถ้ามี
function CameraScanner({ onDetect }: { onDetect: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // @ts-ignore
    if (typeof window !== "undefined" && "BarcodeDetector" in window) setSupported(true);
    else setSupported(false);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let id: number | null = null;

    async function start() {
      if (!supported) return;
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // @ts-ignore
      const detector = new window.BarcodeDetector({ formats: ["ean_13", "code_128", "code_39", "ean_8"] });
      const loop = async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes?.[0]?.rawValue) onDetect(codes[0].rawValue);
        } catch {}
        id = requestAnimationFrame(loop);
      };
      id = requestAnimationFrame(loop);
    }
    start();

    return () => { if (id) cancelAnimationFrame(id); if (stream) stream.getTracks().forEach(t=>t.stop()); };
  }, [supported, onDetect]);

  if (supported === false) return null;
  return <video ref={videoRef} className="rounded-xl w-full max-w-sm border" muted playsInline />;
}

export default function StockCountPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const [lines, setLines] = useState<CountLine[]>([]);
  const [scanned, setScanned] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadBranches(); }, []);

  async function loadBranches() {
    const b = await axios.get<any>("/api/settings/branches", { params: { pageSize: 200 } });
    const arr = Array.isArray(b.data) ? b.data : b.data.items ?? b.data.branches ?? [];
    setBranches(arr.map((x: any) => ({ id: x.id, name: x.name })));
  }

  async function findByBarcode(code: string) {
    const res = await axios.get<any>("/api/products", { params: { search: code, pageSize: 1 } });
    const arr: any[] = Array.isArray(res.data) ? res.data : res.data.items ?? [];
    return arr[0];
  }

  // รับสแกนจากกล้อง
  async function handleDetect(code: string) {
    setScanned(code);
    const p = await findByBarcode(code);
    if (!p) return;
    addOne(p);
  }

  // รับสแกนจากเครื่องสแกน (คีย์บอร์ด)
  function KeyboardCapture() {
    const ref = useRef<HTMLInputElement | null>(null);
    return (
      <Input
        ref={ref}
        placeholder="โฟกัสที่นี่แล้วสแกน (Enter)"
        onKeyDown={async (e) => {
          if (e.key !== "Enter") return;
          const code = (e.target as HTMLInputElement).value.trim();
          if (!code) return;
          (e.target as HTMLInputElement).value = "";
          const p = await findByBarcode(code);
          if (!p) return;
          addOne(p);
        }}
      />
    );
  }

  function addOne(p: any) {
    setLines(prev => {
      const idx = prev.findIndex(x => x.productId === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].countedQty += 1;
        return copy;
      }
      return [...prev, { productId: p.id, countedQty: 1, name: p.name ?? `#${p.id}`, barcode: p.barcode }];
    });
  }

  function setQty(i: number, v: string) {
    setLines(prev => { const copy = [...prev]; copy[i].countedQty = toPosInt(v); return copy; });
  }
  function remove(i: number) { setLines(prev => prev.filter((_,idx)=>idx!==i)); }

  async function commit() {
    const bid = toPosInt(branchId);
    if (!bid) return alert("เลือกสาขา");
    if (!lines.length) return alert("ยังไม่มีรายการนับ");
    try {
      setBusy(true);
      const res = await axios.post("/api/stock-counts/commit", {
        branchId: bid,
        lines: lines.map(l => ({ productId: l.productId, countedQty: l.countedQty })),
      });
      alert("บันทึกแล้ว\nส่วนต่างรวม: " + res.data.summary.totalDiff);
      setLines([]);
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message || "บันทึกการนับล้มเหลว");
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader><CardTitle>นับสต็อก (สาขา)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">สาขา</div>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="เลือกสาขา"/></SelectTrigger>
                <SelectContent>{branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="text-sm font-medium">สแกนด้วยเครื่อง (คีย์บอร์ด)</div>
              <KeyboardCapture />
              <div className="text-xs text-gray-500">ล่าสุด: {scanned || "-"}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">สแกนด้วยกล้อง (ถ้ารองรับ)</div>
            <CameraScanner onDetect={handleDetect} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead><tr className="bg-gray-50">
                <th className="p-2 border">สินค้า</th>
                <th className="p-2 border w-32">จำนวนที่นับ</th>
                <th className="p-2 border w-28">ลบ</th>
              </tr></thead>
              <tbody>
                {lines.map((l,i)=>(
                  <tr key={`${l.productId}-${i}`}>
                    <td className="p-2 border">
                      {l.name ?? `#${l.productId}`}
                      <div className="text-xs text-gray-500">ID:{l.productId}{l.barcode?` • BARCODE:${l.barcode}`:""}</div>
                    </td>
                    <td className="p-2 border">
                      <Input type="number" value={l.countedQty} onChange={(e)=>setQty(i,e.target.value)}/>
                    </td>
                    <td className="p-2 border text-center"><Button variant="destructive" onClick={()=>remove(i)}>ลบ</Button></td>
                  </tr>
                ))}
                {!lines.length && <tr><td className="p-3 text-center text-gray-500" colSpan={3}>ยังไม่มีรายการ</td></tr>}
              </tbody>
            </table>
          </div>

          <Button onClick={commit} disabled={busy}>บันทึกผลการนับ & ปรับสต็อก</Button>
        </CardContent>
      </Card>
    </div>
  );
}
