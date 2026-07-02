import { useRef, useState } from "react";
import { Edit3, Image, Plus, Star, Trash2, UploadCloud, ArrowUp, ArrowDown } from "lucide-react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { uploadToImgBB, useAdminCollection } from "../../hooks/useAdminCollection.js";
import { galleryImages } from "../../data/siteData.js";

const CATEGORIES = ["Cricket", "Food", "Events", "Venue", "Celebrations", "Other"];
const EMPTY = { title: "", category: "Cricket", url: "", featured: false };

export default function AdminGallery() {
  const { data, loading, saving, save, remove } = useAdminCollection("gallery", "createdAt");
  const rows = [...(data.length ? data : galleryImages)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState("");
  const fileRef = useRef();

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function openAdd() { setForm({ ...EMPTY, order: rows.length }); setEditId(null); setModal(true); }
  function openEdit(row) { setForm({ title: row.title, category: row.category, url: row.url, featured: row.featured || false, order: row.order ?? 0 }); setEditId(row.id); setModal(true); }

  async function moveUp(index) {
    if (index === 0) return;
    const current = rows[index];
    const prev = rows[index - 1];
    const currentOrder = current.order ?? index;
    const prevOrder = prev.order ?? (index - 1);
    await save(current.id, { ...current, order: prevOrder });
    await save(prev.id, { ...prev, order: currentOrder });
    showToast("Reordered!");
  }

  async function moveDown(index) {
    if (index === rows.length - 1) return;
    const current = rows[index];
    const next = rows[index + 1];
    const currentOrder = current.order ?? index;
    const nextOrder = next.order ?? (index + 1);
    await save(current.id, { ...current, order: nextOrder });
    await save(next.id, { ...next, order: currentOrder });
    showToast("Reordered!");
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToImgBB(file, setUploadProgress);
      setForm((f) => ({ ...f, url }));
      showToast("Image uploaded!");
    } catch (err) {
      showToast("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleSave() {
    if (!form.title || !form.url) return showToast("Title and image are required");
    const payload = {
      ...form,
      order: form.order ?? rows.length
    };
    await save(editId, payload);
    setModal(false);
    showToast(editId ? "Updated!" : "Added!");
  }

  async function handleDelete(id) {
    if (!confirm("Delete this image?")) return;
    await remove(id);
    showToast("Deleted!");
  }

  async function toggleFeatured(row) {
    await save(row.id, { ...row, featured: !row.featured });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-5xl text-white">GALLERY</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Upload via ImgBB, tag category, feature images, delete, and reorder.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={UploadCloud} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? `Uploading ${uploadProgress}%` : "Quick Upload"}
          </Button>
          <Button icon={Plus} onClick={openAdd}>Add New</Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      <Card hover={false}>
        {loading ? (
          <p className="py-8 text-center text-white/45">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-y border-white/10">
                  {["Image", "Category", "Status", "Actions"].map((h) => (
                    <th key={h} className={`px-3 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/42 ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="border-b border-white/7">
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        {row.url ? (
                          <img src={row.url} alt={row.title} className="h-10 w-14 rounded object-cover" />
                        ) : (
                          <div className="grid h-10 w-14 place-items-center rounded bg-white/10"><Image size={16} className="text-white/30" /></div>
                        )}
                        <span className="text-sm text-white/68">{row.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-white/68">{row.category}</td>
                    <td className="px-3 py-4">
                      <Badge tone={row.featured ? "gold" : "green"}>{row.featured ? "featured" : "active"}</Badge>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => moveUp(index)} disabled={index === 0} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:border-captain-gold hover:text-captain-gold disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-white/60"><ArrowUp size={15} /></button>
                        <button type="button" onClick={() => moveDown(index)} disabled={index === rows.length - 1} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:border-captain-gold hover:text-captain-gold disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-white/60"><ArrowDown size={15} /></button>
                        <button type="button" onClick={() => toggleFeatured(row)} className={`rounded-full border px-3 py-2 text-xs transition ${row.featured ? "border-captain-gold text-captain-gold" : "border-white/10 text-white/60 hover:border-captain-gold hover:text-captain-gold"}`}>
                          <Star size={13} className="inline mr-1" />{row.featured ? "Unfeature" : "Feature"}
                        </button>
                        <button type="button" onClick={() => openEdit(row)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:border-captain-gold hover:text-captain-gold"><Edit3 size={15} /></button>
                        <button type="button" onClick={() => handleDelete(row.id)} className="grid h-9 w-9 place-items-center rounded-full border border-red-400/30 text-red-300 hover:border-red-400 hover:text-red-100"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Image" : "Add Image"}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs text-white/55">Title</label>
            <input className="form-input w-full" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Night nets" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/55">Category</label>
            <select className="form-input w-full" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/55">Image</label>
            <div className="flex gap-2">
              <input className="form-input flex-1" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="Paste URL or upload below" />
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded border border-white/15 px-3 text-sm text-white/60 hover:border-captain-gold hover:text-captain-gold">
                {uploading ? `${uploadProgress}%` : "Upload"}
              </button>
            </div>
            {form.url && <img src={form.url} alt="preview" className="mt-2 h-32 w-full rounded object-cover" />}
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
            Featured (show on homepage)
          </label>
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