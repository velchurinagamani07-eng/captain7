import { useRef, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { uploadToImgBB, useAdminCollection } from "../../hooks/useAdminCollection.js";
import { combos } from "../../data/siteData.js";

const EMPTY = { name: "", items: "", price: "", originalPrice: "", image: "" };

export default function AdminCombos() {
  const { data, loading, saving, save, remove } = useAdminCollection("combos", "createdAt");
  const rows = data.length ? data : combos;
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
    setForm({ name: row.name, items: Array.isArray(row.items) ? row.items.join(", ") : row.items, price: row.price, originalPrice: row.originalPrice || "", image: row.image || "" });
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
    await save(editId, { ...form, price: Number(form.price), originalPrice: Number(form.originalPrice) || 0, items: form.items.split(",").map((s) => s.trim()).filter(Boolean) });
    setModal(false); showToast(editId ? "Updated!" : "Added!");
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div><h1 className="font-display text-5xl text-white">COMBOS</h1><p className="mt-2 text-sm text-white/55">Manage combo deals with images and pricing.</p></div>
        <Button icon={Plus} onClick={openAdd}>Add Combo</Button>
      </div>
      <Card hover={false}>
        {loading ? <p className="py-8 text-center text-white/45">Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead><tr className="border-y border-white/10">
                {["Combo", "Items", "Price", "Actions"].map((h) => (
                  <th key={h} className={`px-3 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/42 ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{rows.map((row) => (
                <tr key={row.id} className="border-b border-white/7">
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      {row.image && <img src={row.image} alt={row.name} className="h-10 w-14 rounded object-cover" />}
                      <span className="text-sm text-white/80">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-white/55">{Array.isArray(row.items) ? row.items.join(", ") : row.items}</td>
                  <td className="px-3 py-4 text-sm text-white/68">₹{row.price}{row.originalPrice ? <span className="ml-1 line-through text-white/30">₹{row.originalPrice}</span> : null}</td>
                  <td className="px-3 py-4"><div className="flex justify-end gap-2">
                    <button type="button" onClick={() => openEdit(row)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:border-captain-gold hover:text-captain-gold"><Edit3 size={15} /></button>
                    <button type="button" onClick={() => { if(confirm("Delete?")) remove(row.id).then(() => showToast("Deleted!")); }} className="grid h-9 w-9 place-items-center rounded-full border border-red-400/30 text-red-300 hover:border-red-400"><Trash2 size={15} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Combo" : "Add Combo"}>
        <div className="flex flex-col gap-4">
          <div><label className="mb-1 block text-xs text-white/55">Combo Name</label><input className="form-input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Match Day Combo" /></div>
          <div><label className="mb-1 block text-xs text-white/55">Items (comma separated)</label><input className="form-input w-full" value={form.items} onChange={(e) => setForm((f) => ({ ...f, items: e.target.value }))} placeholder="Loaded Fries, 2 Mocktails, Margherita" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs text-white/55">Price (₹)</label><input className="form-input w-full" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs text-white/55">Original Price (₹)</label><input className="form-input w-full" type="number" value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))} /></div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/55">Image</label>
            <div className="flex gap-2">
              <input className="form-input flex-1" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="Paste URL or upload" />
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded border border-white/15 px-3 text-sm text-white/60 hover:border-captain-gold">{uploading ? `${uploadProgress}%` : "Upload"}</button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
            {form.image && <img src={form.image} alt="preview" className="mt-2 h-24 w-full rounded object-cover" />}
          </div>
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