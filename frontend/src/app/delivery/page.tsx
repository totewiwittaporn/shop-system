// frontend/app/delivery/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

type Branch = { id: number; name: string };
type Shop = { id: number; displayName: string };
type Template = { id: number; name: string };
type DeliveryLine = { productId?: number | null; quantity: number; _key?: string };
type Delivery = {
  id: number; shopId: number; fromBranchId?: number | null;
  status: "PENDING"|"SHIPPED"|"RECEIVED"|"CANCELED"; createdAt: string;
  template?: Template | null; lines: { productId: number; productName?: string | null; quantity: number; unitPrice?: number | null; amount?: number | null; partnerCategoryCode?: string | null }[];
};

type ProductLite = { id: number; name: string; sku?: string; barcode?: string };

const toPosInt = (v: string | number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };
const ALL = "__all__";

/* ---------- Product Autocomplete ---------- */
function useDebounce<T>(value: T, delay = 250) { const [d,setD] = useState(value); useEffect(()=>{const id=setTimeout(()=>setD(value),delay); return ()=>clearTimeout(id)},[value,delay]); return d; }
function ProductSearchInput({ onPick, placeholder="ค้นหาสินค้า (ชื่อ/รหัส/บาร์โค้ด)" }:{ onPick:(p:ProductLite)=>void; placeholder?:string; }) {
  const [q,setQ]=useState(""); const deb=useDebounce(q,300);
  const [items,setItems]=useState<ProductLite[]>([]); const [open,setOpen]=useState(false); const [loading,setLoading]=useState(false);
  const ref=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{const h=(e:MouseEvent)=>ref.current&&!ref.current.contains(e.target as any)&&setOpen(false); window.addEventListener("click",h); return ()=>window.removeEventListener("click",h)},[]);
  useEffect(()=>{(async()=>{ if(!deb||String(deb).length<2){setItems([]);return;} try{ setLoading(true); const res=await axios.get<any>("/api/products",{params:{search:deb,pageSize:12}}); const arr:any[]=Array.isArray(res.data)?res.data:res.data.items??[]; setItems(arr.map((p:any)=>({id:p.id,name:p.name??p.productName??`#${p.id}`,sku:p.sku,barcode:p.barcode}))); setOpen(true);} finally{setLoading(false);} })()},[deb]);
  return (
    <div className="relative" ref={ref}>
      <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={placeholder}/>
      {open&&(<div className="absolute z-40 mt-1 w-full rounded-xl border bg-white shadow max-h-72 overflow-auto">
        {loading?<div className="p-2 text-sm text-gray-500">กำลังค้นหา…</div>:
          items.length?items.map(it=>(
            <button key={it.id} className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={()=>{onPick(it); setQ(""); setOpen(false);}}>
              <div className="font-medium">{it.name}</div>
              <div className="text-xs text-gray-500">ID:{it.id}{it.sku?` • SKU:${it.sku}`:""}{it.barcode?` • BARCODE:${it.barcode}`:""}</div>
            </button>
          )):<div className="p-2 text-sm text-gray-500">ไม่พบสินค้า</div>}
      </div>)}
    </div>
  );
}

export default function DeliveryPage() {
  const [branches,setBranches]=useState<Branch[]>([]);
  const [shops,setShops]=useState<Shop[]>([]);
  const [templates,setTemplates]=useState<Template[]>([]);

  // header
  const [shopId,setShopId]=useState<string>("");
  const [fromBranchId,setFromBranchId]=useState<string>("");
  const [templateId,setTemplateId]=useState<string>("");

  // lines: เริ่มด้วย 1 แถวว่าง
  const [lines,setLines]=useState<DeliveryLine[]>([{quantity:0,_key:crypto.randomUUID()}]);

  // list & filters
  const [fShopId,setFShopId]=useState<string>(ALL);
  const [fBranchId,setFBranchId]=useState<string>(ALL);
  const [fStatus,setFStatus]=useState<string>(ALL);
  const [docs,setDocs]=useState<Delivery[]>([]);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState<string|null>(null);

  const canCreate = useMemo(()=>{
    const sid = toPosInt(shopId); if(!sid) return false;
    const valid = lines.filter(l=>toPosInt(l.productId||0)>0 && toPosInt(l.quantity)>0);
    return valid.length>0;
  },[shopId,lines]);

  useEffect(()=>{loadMasters();},[]);
  useEffect(()=>{loadDocs();},[fShopId,fBranchId,fStatus]);

  async function loadMasters(){
    try{
      const [b,s]=await Promise.all([
        axios.get<any>("/api/settings/branches",{params:{pageSize:200}}),
        axios.get<any>("/api/settings/shops",{params:{type:"consignment",pageSize:200}}),
      ]);
      const branchArr=Array.isArray(b.data)?b.data:b.data.items??b.data.branches??[];
      const shopArr=Array.isArray(s.data)?s.data:s.data.items??s.data.shops??[];
      setBranches(branchArr.map((x:any)=>({id:x.id,name:x.name})));
      setShops(shopArr.map((x:any)=>({id:x.id,displayName:x.name})));
    } catch(e:any){ setErr(e?.response?.data?.error||e.message||"โหลดข้อมูลหลักล้มเหลว"); }
  }
  async function loadTemplatesForShop(sid:number){
    try{ const res=await axios.get<any>("/api/settings/delivery-templates",{params:{scope:"CONSIGNMENT",consignmentShopId:sid,pageSize:100}}); const arr=Array.isArray(res.data)?res.data:res.data.items??[]; setTemplates(arr); }
    catch{ setTemplates([]); }
  }
  async function loadDocs(){
    setLoading(true);
    try{
      const params:any={};
      if(fShopId!==ALL && toPosInt(fShopId)) params.shopId=toPosInt(fShopId);
      if(fBranchId!==ALL && toPosInt(fBranchId)) params.fromBranchId=toPosInt(fBranchId);
      if(fStatus!==ALL) params.status=fStatus;
      const res=await axios.get<Delivery[]>("/api/delivery-docs",{params});
      setDocs(res.data);
    } finally{ setLoading(false); }
  }

  // auto-add แถวใหม่เมื่อมีการกรอก
  useEffect(()=>{
    const last = lines[lines.length-1];
    if(!last) return;
    const hasData = toPosInt(last.productId||0)>0 || toPosInt(last.quantity)>0;
    if(hasData){
      setLines((prev)=> prev.some(x=>!x.productId && !x.quantity) ? prev : [...prev,{quantity:0,_key:crypto.randomUUID()}]);
    }
  },[lines]);

  function setProduct(i:number,p:ProductLite){
    setLines(prev=>{ const arr=[...prev]; arr[i]={...arr[i],productId:p.id}; return arr; });
  }
  function setQty(i:number,v:string){
    setLines(prev=>{ const arr=[...prev]; arr[i]={...arr[i],quantity:toPosInt(v)}; return arr; });
  }
  function removeLine(i:number){ setLines(prev=> prev.filter((_,idx)=>idx!==i)); }

  async function createDoc(){
    if(!canCreate) return alert("ระบุร้าน + รายการ (สินค้า/จำนวน) ให้ครบ");
    try{
      setLoading(true);
      await axios.post("/api/delivery-docs",{
        shopId: toPosInt(shopId),
        fromBranchId: toPosInt(fromBranchId)||undefined,
        templateId: toPosInt(templateId)||undefined,
        lines: lines.filter(l=>toPosInt(l.productId||0)>0 && toPosInt(l.quantity)>0)
                   .map(l=>({productId:toPosInt(l.productId||0),quantity:toPosInt(l.quantity)})),
      });
      setLines([{quantity:0,_key:crypto.randomUUID()}]);
      await loadDocs();
      alert("สร้างใบส่งของสำเร็จ");
    } catch(e:any){ alert(e?.response?.data?.error||e.message||"สร้างใบส่งของล้มเหลว"); }
    finally{ setLoading(false); }
  }

  async function updateStatus(id:number, status:Delivery["status"]){
    try{ setLoading(true); await axios.put(`/api/delivery-docs/${id}/status`,{status}); await loadDocs(); }
    catch(e:any){ alert(e?.response?.data?.error||e.message||"อัปเดตสถานะล้มเหลว"); }
    finally{ setLoading(false); }
  }

  const shopName=(id?:number)=> id? shops.find(s=>s.id===id)?.displayName ?? `Shop #${id}` : "-";
  const branchName=(id?:number|null)=> id? branches.find(b=>b.id===id)?.name ?? `Branch #${id}` : "-";

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader><CardTitle>สร้างใบส่งของ</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">ร้านฝากขาย</div>
              <Select value={shopId} onValueChange={async (v)=>{ setShopId(v); const sid=toPosInt(v); if(sid) await loadTemplatesForShop(sid); else setTemplates([]); }}>
                <SelectTrigger><SelectValue placeholder={shops.length?"เลือกร้าน":"กำลังโหลดร้าน…"} /></SelectTrigger>
                <SelectContent>{shops.map(s=><SelectItem key={s.id} value={String(s.id)}>{s.displayName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">สาขาต้นทาง (ถ้ามี)</div>
              <Select value={fromBranchId} onValueChange={setFromBranchId}>
                <SelectTrigger><SelectValue placeholder={branches.length?"เลือกสาขา (ไม่บังคับ)":"กำลังโหลดสาขา…"} /></SelectTrigger>
                <SelectContent>{branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Template (ตามร้าน)</div>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder={shopId?(templates.length?"เลือกเทมเพลต":"ไม่มีเทมเพลต"): "เลือกร้านก่อน"} /></SelectTrigger>
                <SelectContent>{templates.map(t=><SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">รายการสินค้า</div>
            {lines.map((l,i)=>(
              <div key={l._key || i} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <div className="md:col-span-4">
                  <ProductSearchInput onPick={(p)=>setProduct(i,p)} />
                  {!!l.productId && <div className="text-xs text-gray-500 mt-1">เลือกแล้ว: #{l.productId}</div>}
                </div>
                <Input type="number" placeholder="จำนวน" value={l.quantity||""} onChange={(e)=>setQty(i,e.target.value)} />
                <div className="flex items-center">
                  <Button variant="destructive" onClick={()=>removeLine(i)}>ลบ</Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={createDoc} disabled={loading || !canCreate}>สร้างใบส่งของ</Button>
            {err && <span className="text-sm text-red-600">{err}</span>}
          </div>
        </CardContent>
      </Card>

      {/* รายการเอกสาร */}
      <Card>
        <CardHeader><CardTitle>รายการใบส่งของ</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1"><div className="text-sm font-medium">ร้าน</div>
              <Select value={fShopId} onValueChange={setFShopId}>
                <SelectTrigger><SelectValue placeholder="ทั้งหมด"/></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>ทั้งหมด</SelectItem>{shops.map(s=><SelectItem key={s.id} value={String(s.id)}>{s.displayName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><div className="text-sm font-medium">สาขาต้นทาง</div>
              <Select value={fBranchId} onValueChange={setFBranchId}>
                <SelectTrigger><SelectValue placeholder="ทั้งหมด"/></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>ทั้งหมด</SelectItem>{branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><div className="text-sm font-medium">สถานะ</div>
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger><SelectValue placeholder="ทุกสถานะ"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>ทั้งหมด</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="SHIPPED">SHIPPED</SelectItem>
                  <SelectItem value="RECEIVED">RECEIVED</SelectItem>
                  <SelectItem value="CANCELED">CANCELED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end"><Button onClick={loadDocs} disabled={loading}>ค้นหา</Button></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">ร้าน</th>
                  <th className="p-2 border">สาขาต้นทาง</th>
                  <th className="p-2 border">วันที่</th>
                  <th className="p-2 border">สถานะ</th>
                  <th className="p-2 border">Template</th>
                  <th className="p-2 border">รายการ</th>
                  <th className="p-2 border">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d)=>(
                  <tr key={d.id} className="align-top">
                    <td className="p-2 border">{d.id}</td>
                    <td className="p-2 border">{shopName(d.shopId)}</td>
                    <td className="p-2 border">{branchName(d.fromBranchId)}</td>
                    <td className="p-2 border">{new Date(d.createdAt).toLocaleString("th-TH")}</td>
                    <td className="p-2 border">{d.status}</td>
                    <td className="p-2 border">{d.template?.name ?? "-"}</td>
                    <td className="p-2 border">
                      {d.lines?.length ? d.lines.map((l,i)=>(
                        <div key={i}>
                          {l.partnerCategoryCode ? `[${l.partnerCategoryCode}] ` : ""}
                          {l.productName ?? `#${l.productId}`} × {l.quantity}
                          {l.unitPrice != null ? ` (@${l.unitPrice}) = ${l.amount ?? (Number(l.unitPrice) * Number(l.quantity||0))}` : ""}
                        </div>
                      )) : "-"}
                    </td>
                    <td className="p-2 border whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={()=>updateStatus(d.id,"SHIPPED")} disabled={loading}>ส่งแล้ว</Button>
                        <Button variant="secondary" onClick={()=>updateStatus(d.id,"RECEIVED")} disabled={loading}>รับแล้ว</Button>
                        <Button variant="destructive" onClick={()=>updateStatus(d.id,"CANCELED")} disabled={loading}>ยกเลิก</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!docs.length && (<tr><td className="p-3 text-center text-gray-500" colSpan={8}>ไม่มีข้อมูล</td></tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
