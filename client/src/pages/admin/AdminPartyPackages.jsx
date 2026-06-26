import { useRef, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { uploadToImgBB, useAdminCollection } from "../../hooks/useAdminCollection.js";
import { partyPackages } from "../../data/siteData.js";

const EMPTY = { name: "", tier: "", price: "", priceType: "per head", badge: "", inclusions: "", image: "", isMostPopular: false };

export default function AdminPartyPackages() {
  const { data, loading, saving, save, remove } = useAdminCollection("partyPackages", "createdAt");
  const rows = data.length ? data : partyPackages;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState("");
  const fileRef = useRef();

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }
  function openAdd() { setForm(EMPTY); setEditId(null); setModal(true); }
  function openEdit(row) {
    setForm({ name: row.name, tier: row.tier || "", price: row.price, priceType: row.priceType || "per head", badge: row.badge || "", inclusions: Array.isArray(row.inclusions) ? row.inclusions.join("\n") : row.inclusions || "", image: (Array.isArray(row.images) ? row.images[0] : row.image) || "", isMostPopular: row.isMostPopular || false });
    setEditId(row.id); setModal(true);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const url = await uploadToImgBB(file, setUploadProgress); setForm((f) => ({ ...f, image: url })); showToast("Uploaded!"); }
    catch (err) { showToast("Upload failed: " + err.message); }
    finally { setUploading(false); setUploadProgress(0); }
  }

  async function handleSave() {
    if (!form.name || !form.price) return showToast("Name and price required");
    const inclusions = form.inclusions.split("\n").map((s) => s.trim()).filter(Boolean);
    await save(editId, { ...form, price: Number(form.price), inclusions, images: [form.image].filter(Boolean) });
    setModal(false); showToast(editId ? "Updated!" : "Added!");
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div><h1 className="font-display text-5xl text-white">PARTY PACKAGES</h1><p className="mt-2 text-sm text-white/55">Manage party packages, pricing and inclusions.</p></div>
        <Button icon={Plus} onClick={openAdd}>Add Package</Button>
      </div>
      <Card hover={false}>
        {loading ? <p className="py-8 text-center text-white/45">Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead><tr className="border-y border-white/10">
                {["Package", "Tier", "Price", "Status", "Actions"].map((h) => (
                  <th key={h} className={`px-3 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/42 ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{rows.map((row) => (
                <tr key={row.id} className="border-b border-white/7">
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      {(row.images?.[0] || row.image) && <img src={row.images?.[0] || row.image} alt={row.name} className="h-10 w-14 rounded object-cover" />}
                      <span className="text-sm text-white/80">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-white/68">{row.tier}</td>
                  <td className="px-3 py-4 text-sm text-white/68">₹{row.price} <span className="text-white/40">{row.priceType}</span></td>
                  <td className="px-3 py-4"><Badge tone={row.isMostPopular ? "gold" : "green"}>{row.isMostPopular ? "popular" : "active"}</Badge></td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Package" : "Add Package"}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="mb-1 block text-xs text-white/55">Package Name</label><input className="form-input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Classic Captain" /></div>
            <div><label className="mb-1 block text-xs text-white/55">Tier</label><input className="form-input w-full" value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))} placeholder="Entry" /></div>
            <div><label className="mb-1 block text-xs text-white/55">Badge</label><input className="form-input w-full" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} placeholder="Smart Start" /></div>
            <div><label className="mb-1 block text-xs text-white/55">Price (₹)</label><input className="form-input w-full" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs text-white/55">Price Type</label><input className="form-input w-full" value={form.priceType} onChange={(e) => setForm((f) => ({ ...f, priceType: e.target.value }))} placeholder="per head" /></div>
          </div>
          <div><label className="mb-1 block text-xs text-white/55">Inclusions (one per line)</label><textarea className="form-input w-full" rows={4} value={form.inclusions} onChange={(e) => setForm((f) => ({ ...f, inclusions: e.target.value }))} placeholder={"Cafe seating\nStarter platter\nBasic decoration"} /></div>
          <div>
            <label className="mb-1 block text-xs text-white/55">Image</label>
            <div className="flex gap-2">
              <input className="form-input flex-1" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="Paste URL or upload" />
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded border border-white/15 px-3 text-sm text-white/60 hover:border-captain-gold">{uploading ? `${uploadProgress}%` : "Upload"}</button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
            {form.image && <img src={form.image} alt="preview" className="mt-2 h-24 w-full rounded object-cover" />}
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={form.isMostPopular} onChange={(e) => setForm((f) => ({ ...f, isMostPopular: e.target.checked }))} /> Most Popular</label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </Modal>
      <Toast message={toast} tone="green" />
    </div>
  );
}