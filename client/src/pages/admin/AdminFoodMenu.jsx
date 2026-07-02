import { useRef, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { uploadToImgBB, useAdminCollection } from "../../hooks/useAdminCollection.js";
import { menuItems, menuCategories } from "../../data/siteData.js";

const EMPTY = { name: "", category: "Pizza", price: "", description: "", image: "", isVeg: true, isBestseller: false, visible: true, active: true };

export default function AdminFoodMenu() {
  const { data, loading, saving, save, remove } = useAdminCollection("menuItems", "createdAt");
  const rows = data.length ? data : menuItems;

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
    setForm({ name: row.name, category: row.category, price: row.price, description: row.description || "", image: row.image || "", isVeg: row.isVeg ?? true, isBestseller: row.isBestseller ?? false, visible: row.visible ?? true, active: row.active ?? true });
    setEditId(row.id); setModal(true);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToImgBB(file, setUploadProgress);
      setForm((f) => ({ ...f, image: url }));
      showToast("Image uploaded!");
    } catch (err) { showToast("Upload failed: " + err.message); }
    finally { setUploading(false); setUploadProgress(0); }
  }

  async function handleSave() {
    if (!form.name || !form.price) return showToast("Name and price are required");
    await save(editId, { ...form, price: Number(form.price) });
    setModal(false); showToast(editId ? "Updated!" : "Added!");
  }

  async function handleDelete(id) {
    if (!confirm("Delete this item?")) return;
    await remove(id); showToast("Deleted!");
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-5xl text-white">FOOD MENU</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Add items, upload images, set category, toggle bestseller and visibility.</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add Item</Button>
      </div>
      <Card hover={false}>
        {loading ? <p className="py-8 text-center text-white/45">Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-y border-white/10">
                  {["Item", "Category", "Price", "Type", "Status", "Actions"].map((h) => (
                    <th key={h} className={`px-3 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/42 ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/7">
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        {row.image && <img src={row.image} alt={row.name} className="h-10 w-14 rounded object-cover" />}
                        <div>
                          <p className="text-sm text-white/80">{row.name}</p>
                          {row.isBestseller && <span className="text-xs text-captain-gold">★ Bestseller</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-white/68">{row.category}</td>
                    <td className="px-3 py-4 text-sm text-white/68">₹{row.price}</td>
                    <td className="px-3 py-4 text-sm text-white/68">{row.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}</td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => save(row.id, { ...row, active: row.active === false ? true : false })}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${row.active === false ? "bg-white/10 text-white/50 hover:bg-white/20" : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"}`}
                      >
                        {row.active === false ? "Inactive" : "Active"}
                      </button>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEdit(row)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:border-captain-gold hover:text-captain-gold"><Edit3 size={15} /></button>
                        <button type="button" onClick={() => handleDelete(row.id)} className="grid h-9 w-9 place-items-center rounded-full border border-red-400/30 text-red-300 hover:border-red-400"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Item" : "Add Item"}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-white/55">Item Name</label>
              <input className="form-input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Classic Margherita" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/55">Category</label>
              <select className="form-input w-full" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {menuCategories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/55">Price (₹)</label>
              <input className="form-input w-full" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="199" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-white/55">Description</label>
              <textarea className="form-input w-full" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-white/55">Image</label>
              <div className="flex gap-2">
                <input className="form-input flex-1" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="Paste URL or upload" />
                <button type="button" onClick={() => fileRef.current?.click()} className="rounded border border-white/15 px-3 text-sm text-white/60 hover:border-captain-gold hover:text-captain-gold">
                  {uploading ? `${uploadProgress}%` : "Upload"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </div>
              {form.image && <img src={form.image} alt="preview" className="mt-2 h-24 w-full rounded object-cover" />}
            </div>
          </div>
          <div className="flex gap-6 text-sm text-white/70">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.isVeg} onChange={(e) => setForm((f) => ({ ...f, isVeg: e.target.checked }))} /> Veg</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.isBestseller} onChange={(e) => setForm((f) => ({ ...f, isBestseller: e.target.checked }))} /> Bestseller</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.visible !== false} onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))} /> Visible</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.active !== false} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /> Active</label>
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