import { useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { useAdminCollection } from "../../hooks/useAdminCollection.js";
import { coupons } from "../../data/siteData.js";

const EMPTY = { code: "", discountType: "percent", discountValue: "", minOrder: "", applicableTo: "all", active: true };

export default function AdminCoupons() {
  const { data, loading, saving, save, remove } = useAdminCollection("coupons", "createdAt");
  const rows = data.length ? data : coupons;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState("");

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }
  function openAdd() { setForm(EMPTY); setEditId(null); setModal(true); }
  function openEdit(row) { setForm({ code: row.code, discountType: row.discountType, discountValue: row.discountValue, minOrder: row.minOrder || "", applicableTo: row.applicableTo || "all", active: row.active ?? true }); setEditId(row.id); setModal(true); }

  async function handleSave() {
    if (!form.code || !form.discountValue) return showToast("Code and discount required");
    await save(editId, { ...form, discountValue: Number(form.discountValue), minOrder: Number(form.minOrder) || 0, code: form.code.toUpperCase() });
    setModal(false); showToast(editId ? "Updated!" : "Added!");
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div><h1 className="font-display text-5xl text-white">COUPONS</h1><p className="mt-2 text-sm text-white/55">Manage discount codes and promotional offers.</p></div>
        <Button icon={Plus} onClick={openAdd}>Add Coupon</Button>
      </div>
      <Card hover={false}>
        {loading ? <p className="py-8 text-center text-white/45">Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead><tr className="border-y border-white/10">
                {["Code", "Discount", "Min Order", "Applies To", "Status", "Actions"].map((h) => (
                  <th key={h} className={`px-3 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/42 ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{rows.map((row) => (
                <tr key={row.id || row.code} className="border-b border-white/7">
                  <td className="px-3 py-4 font-mono text-sm text-captain-gold">{row.code}</td>
                  <td className="px-3 py-4 text-sm text-white/68">{row.discountType === "percent" ? `${row.discountValue}%` : `₹${row.discountValue}`}</td>
                  <td className="px-3 py-4 text-sm text-white/68">₹{row.minOrder || 0}</td>
                  <td className="px-3 py-4 text-sm text-white/68">{row.applicableTo}</td>
                  <td className="px-3 py-4"><Badge tone={row.active ? "green" : "grey"}>{row.active ? "active" : "inactive"}</Badge></td>
                  <td className="px-3 py-4"><div className="flex justify-end gap-2">
                    <button type="button" onClick={() => openEdit(row)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:border-captain-gold hover:text-captain-gold"><Edit3 size={15} /></button>
                    <button type="button" onClick={() => { if(confirm("Delete?")) remove(row.id).then(() => showToast("Deleted!")); }} className="grid h-9 w-9 place-items-center rounded-full border border-red-400/30 text-red-300"><Trash2 size={15} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Coupon" : "Add Coupon"}>
        <div className="flex flex-col gap-4">
          <div><label className="mb-1 block text-xs text-white/55">Coupon Code</label><input className="form-input w-full uppercase" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="CAPTAIN20" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs text-white/55">Discount Type</label>
              <select className="form-input w-full" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div><label className="mb-1 block text-xs text-white/55">Discount Value</label><input className="form-input w-full" type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs text-white/55">Min Order (₹)</label><input className="form-input w-full" type="number" value={form.minOrder} onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs text-white/55">Applies To</label>
              <select className="form-input w-full" value={form.applicableTo} onChange={(e) => setForm((f) => ({ ...f, applicableTo: e.target.value }))}>
                <option value="all">All</option>
                <option value="cricket">Cricket</option>
                <option value="food">Food</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /> Active</label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </Modal>
      <Toast message={toast} tone="green" />
    </div>
  );
}