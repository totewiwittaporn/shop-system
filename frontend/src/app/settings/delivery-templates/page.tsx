// src/app/settings/delivery-templates/page.tsx
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

type TemplateScope = "GLOBAL" | "BRANCH_SHARED" | "CONSIGNMENT";

type TemplateConfig = {
  patternKey?: string;
  headerNote?: string;
  footerNote?: string;
  // ใส่ field อื่นสำหรับ layout/policy เพิ่มได้ที่นี่ (เช่น columns/numbering)
};

type Template = {
  id?: number;
  scope: TemplateScope;
  branchId?: number | null;
  consignmentShopId?: number | null;
  name: string;
  config: TemplateConfig;
  createdAt?: string;
};

type ListResp =
  | Template[]
  | { items: Template[]; total: number; page: number; pageSize: number };

type Branch = { id: number; name: string };
type ConsignmentShop = { id: number; displayName: string };

const toPosInt = (v: string | number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export default function DeliveryTemplatesPage() {
  // list & filters
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [shops, setShops] = useState<ConsignmentShop[]>([]);
  const [filterScope, setFilterScope] = useState<TemplateScope>("GLOBAL");
  const [filterBranchId, setFilterBranchId] = useState<number>(0);
  const [filterShopId, setFilterShopId] = useState<number>(0);
  const [search, setSearch] = useState("");

  // create/edit
  const [form, setForm] = useState<Template>({
    scope: "GLOBAL",
    branchId: null,
    consignmentShopId: null,
    name: "",
    config: { patternKey: "", headerNote: "", footerNote: "" },
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Template | null>(null);

  const branchMap = useMemo(() => {
    const m: Record<number, string> = {};
    for (const b of branches) m[b.id] = b.name;
    return m;
  }, [branches]);

  const shopMap = useMemo(() => {
    const m: Record<number, string> = {};
    for (const s of shops) m[s.id] = s.displayName;
    return m;
  }, [shops]);

  useEffect(() => {
    load();
    loadBranches();
    loadConsignmentShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterScope, filterBranchId, filterShopId]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      // ใช้เส้นทางเดิมของคุณเพื่อไม่ให้ 404 (ถ้าคุณย้ายเป็น /api/v1/delivery-templates แล้ว ค่อยเปลี่ยนตรงนี้)
      const res = await axios.get<ListResp>("/api/settings/delivery-templates", {
        params: {
          scope: filterScope,
          branchId:
            filterScope === "BRANCH_SHARED" ? filterBranchId || undefined : undefined,
          consignmentShopId:
            filterScope === "CONSIGNMENT" ? filterShopId || undefined : undefined,
          search: search || undefined,
        },
      });
      const data = Array.isArray(res.data) ? res.data : res.data.items;
      setTemplates(data || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || "โหลดรายการล้มเหลว");
    } finally {
      setLoading(false);
    }
  }

  async function loadBranches() {
    try {
      const res = await axios.get<any>("/api/settings/branches", { params: { pageSize: 100 } });
      const arr = Array.isArray(res.data) ? res.data : res.data.items ?? res.data.branches ?? [];
      setBranches(arr.map((b: any) => ({ id: b.id, name: b.name })));
    } catch {}
  }

  async function loadConsignmentShops() {
    try {
      const res = await axios.get<any>("/api/settings/shops", {
        params: { type: "consignment", pageSize: 100 },
      });
      const arr = Array.isArray(res.data) ? res.data : res.data.items ?? res.data.shops ?? [];
      setShops(arr.map((s: any) => ({ id: s.id, displayName: s.name })));
    } catch {}
  }

  /* ----- Create ----- */
  const canCreate = useMemo(() => {
    const nameOk = form.name.trim().length > 0;
    const scopeOk =
      form.scope === "BRANCH_SHARED"
        ? toPosInt(form.branchId || 0) > 0
        : form.scope === "CONSIGNMENT"
        ? toPosInt(form.consignmentShopId || 0) > 0
        : true;
    return nameOk && scopeOk;
  }, [form]);

  async function createTemplate() {
    if (!canCreate) return alert("กรอกชื่อและเลือก Branch/Shop ให้ถูกต้องตาม Scope");
    try {
      setLoading(true);
      await axios.post("/api/settings/delivery-templates", {
        scope: form.scope,
        branchId: form.scope === "BRANCH_SHARED" ? toPosInt(form.branchId || 0) : undefined,
        consignmentShopId:
          form.scope === "CONSIGNMENT" ? toPosInt(form.consignmentShopId || 0) : undefined,
        name: form.name.trim(),
        // ✅ ไม่มี lines แล้ว: config เก็บแต่ policy/layout
        config: {
          patternKey: form.config.patternKey || undefined,
          headerNote: form.config.headerNote || undefined,
          footerNote: form.config.footerNote || undefined,
        },
      });
      setForm({
        scope: "GLOBAL",
        branchId: null,
        consignmentShopId: null,
        name: "",
        config: { patternKey: "", headerNote: "", footerNote: "" },
      });
      await load();
      alert("บันทึกเทมเพลตสำเร็จ");
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message || "สร้างเทมเพลตล้มเหลว");
    } finally {
      setLoading(false);
    }
  }

  /* ----- Edit ----- */
  const startEdit = (t: Template) => {
    setEditId(t.id!);
    setEditForm({
      ...t,
      branchId: t.branchId ?? null,
      consignmentShopId: t.consignmentShopId ?? null,
      config: {
        patternKey: t.config?.patternKey || "",
        headerNote: t.config?.headerNote || "",
        footerNote: t.config?.footerNote || "",
      },
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm(null);
  };

  const canUpdate = useMemo(() => {
    if (!editForm) return false;
    const nameOk = editForm.name.trim().length > 0;
    const scopeOk =
      editForm.scope === "BRANCH_SHARED"
        ? toPosInt(editForm.branchId || 0) > 0
        : editForm.scope === "CONSIGNMENT"
        ? toPosInt(editForm.consignmentShopId || 0) > 0
        : true;
    return nameOk && scopeOk;
  }, [editForm]);

  async function updateTemplate() {
    if (!editForm || !editId) return;
    if (!canUpdate) return alert("กรอกชื่อและเลือก Branch/Shop ให้ถูกต้องตาม Scope");
    try {
      setLoading(true);
      await axios.put(`/api/settings/delivery-templates/${editId}`, {
        scope: editForm.scope,
        branchId:
          editForm.scope === "BRANCH_SHARED" ? toPosInt(editForm.branchId || 0) : undefined,
        consignmentShopId:
          editForm.scope === "CONSIGNMENT"
            ? toPosInt(editForm.consignmentShopId || 0)
            : undefined,
        name: editForm.name.trim(),
        config: {
          patternKey: editForm.config.patternKey || undefined,
          headerNote: editForm.config.headerNote || undefined,
          footerNote: editForm.config.footerNote || undefined,
        },
      });
      await load();
      cancelEdit();
      alert("อัปเดตเทมเพลตสำเร็จ");
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message || "แก้ไขเทมเพลตล้มเหลว");
    } finally {
      setLoading(false);
    }
  }

  /* ----- Delete ----- */
  async function deleteTemplate(id?: number) {
    if (!id) return;
    if (!confirm("ยืนยันลบเทมเพลตนี้?")) return;
    try {
      setLoading(true);
      await axios.delete(`/api/settings/delivery-templates/${id}`);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message || "ลบเทมเพลตล้มเหลว");
    } finally {
      setLoading(false);
    }
  }

  /* ========================= UI ========================= */
  return (
    <div className="p-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle>สร้าง Delivery Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Scope</div>
              <Select
                value={form.scope}
                onValueChange={(v) => setForm((p) => ({ ...p, scope: v as TemplateScope }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกขอบเขต" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global (ใช้ทุกสาขา)</SelectItem>
                  <SelectItem value="BRANCH_SHARED">Shared per Branch</SelectItem>
                  <SelectItem value="CONSIGNMENT">Consignment Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.scope === "BRANCH_SHARED" && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Branch</div>
                <Select
                  value={form.branchId ? String(form.branchId) : undefined}
                  onValueChange={(v) => setForm((p) => ({ ...p, branchId: toPosInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={branches.length ? "เลือกสาขา" : "กำลังโหลดสาขา…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.length ? (
                      branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="-1" disabled>
                        กำลังโหลด…
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.scope === "CONSIGNMENT" && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Consignment Shop</div>
                <Select
                  value={form.consignmentShopId ? String(form.consignmentShopId) : undefined}
                  onValueChange={(v) => setForm((p) => ({ ...p, consignmentShopId: toPosInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={shops.length ? "เลือกร้านฝากขาย" : "กำลังโหลดร้าน…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.length ? (
                      shops.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.displayName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="-1" disabled>
                        กำลังโหลด…
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1 md:col-span-1">
              <div className="text-sm font-medium">Template Name</div>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="เช่น ShopX รอบเช้า"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Pattern Key (ออปชัน)</div>
              <Input
                value={form.config.patternKey || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, config: { ...p.config, patternKey: e.target.value } }))
                }
                placeholder="เช่น SHOPX_V1"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="text-sm font-medium">Header / Footer Note (ออปชัน)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  value={form.config.headerNote || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, config: { ...p.config, headerNote: e.target.value } }))
                  }
                  placeholder="ข้อความหัวใบส่ง"
                />
                <Input
                  value={form.config.footerNote || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, config: { ...p.config, footerNote: e.target.value } }))
                  }
                  placeholder="ข้อความท้ายใบส่ง"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={createTemplate} disabled={loading || !canCreate}>
              บันทึกเทมเพลต
            </Button>
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการเทมเพลต</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Scope</div>
              <Select value={filterScope} onValueChange={(v) => setFilterScope(v as TemplateScope)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกขอบเขต" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  <SelectItem value="BRANCH_SHARED">Branch Shared</SelectItem>
                  <SelectItem value="CONSIGNMENT">Consignment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterScope === "BRANCH_SHARED" && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Branch</div>
                <Select value={String(filterBranchId)} onValueChange={(v) => setFilterBranchId(toPosInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterScope === "CONSIGNMENT" && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Consignment Shop</div>
                <Select value={String(filterShopId || 0)} onValueChange={(v) => setFilterShopId(toPosInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกร้านฝากขาย" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="md:col-span-3 space-y-1">
              <div className="text-sm font-medium">Search</div>
              <div className="flex gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อเทมเพลต" />
                <Button variant="secondary" onClick={load} disabled={loading}>
                  ค้นหา
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Scope</th>
                  <th className="p-2 border">Branch / Shop</th>
                  <th className="p-2 border">Notes</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="align-top">
                    <td className="p-2 border whitespace-nowrap">{t.id}</td>

                    <td className="p-2 border min-w-[12rem]">
                      {editId === t.id ? (
                        <Input
                          value={editForm?.name || ""}
                          onChange={(e) =>
                            setEditForm((p) => (p ? { ...p, name: e.target.value } : p))
                          }
                        />
                      ) : (
                        t.name
                      )}
                    </td>

                    <td className="p-2 border whitespace-nowrap">{t.scope}</td>

                    <td className="p-2 border whitespace-nowrap">
                      {t.scope === "BRANCH_SHARED"
                        ? t.branchId
                          ? branchMap[t.branchId] || `Branch #${t.branchId}`
                          : "-"
                        : t.scope === "CONSIGNMENT"
                        ? t.consignmentShopId
                          ? shopMap[t.consignmentShopId] || `Shop #${t.consignmentShopId}`
                          : "-"
                        : "-"}
                    </td>

                    <td className="p-2 border">
                      {editId === t.id ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input
                            value={editForm?.config.headerNote || ""}
                            onChange={(e) =>
                              setEditForm((p) =>
                                p ? { ...p, config: { ...p.config, headerNote: e.target.value } } : p
                              )
                            }
                            placeholder="Header note"
                          />
                          <Input
                            value={editForm?.config.footerNote || ""}
                            onChange={(e) =>
                              setEditForm((p) =>
                                p ? { ...p, config: { ...p.config, footerNote: e.target.value } } : p
                              )
                            }
                            placeholder="Footer note"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-gray-700">
                            {t.config?.headerNote ? `หัวใบ: ${t.config.headerNote}` : <span className="text-gray-400">หัวใบ: -</span>}
                          </div>
                          <div className="text-gray-700">
                            {t.config?.footerNote ? `ท้ายใบ: ${t.config.footerNote}` : <span className="text-gray-400">ท้ายใบ: -</span>}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="p-2 border whitespace-nowrap">
                      {editId === t.id ? (
                        <div className="flex gap-2">
                          <Button onClick={updateTemplate} disabled={loading || !canUpdate}>
                            บันทึก
                          </Button>
                          <Button variant="secondary" onClick={cancelEdit}>
                            ยกเลิก
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="secondary" onClick={() => startEdit(t)}>
                            แก้ไข
                          </Button>
                          <Button variant="destructive" onClick={() => deleteTemplate(t.id)}>
                            ลบ
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {!templates.length && (
                  <tr>
                    <td className="p-3 text-center text-gray-500" colSpan={6}>
                      ยังไม่มีเทมเพลต
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
