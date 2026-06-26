import { useState, useMemo } from "react";
import { Edit3, Plus, Trash2, Camera, UploadCloud, Smartphone, Monitor, Check, Eye } from "lucide-react";
import { doc, setDoc, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase.js";
import { useCollection } from "../../hooks/useFirestore.js";
import { uploadToImgBB } from "../../hooks/useAdminCollection.js";
import { Modal } from "../../components/ui/Modal.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";

const EMPTY_BANNER = {
  caption: "",
  imageUrl: "",
  creditText: "Website made by Wayzentech: 9398724704",
  buttonText: "Next Go To Website",
  buttonUrl: "",
  active: true
};

export default function AdminFestivalBanners() {
  const { data: festivals, loading } = useCollection("festivals", [], { live: true });
  const [toast, setToast] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_BANNER);
  const [editId, setEditId] = useState(null);
  
  // Preview States
  const [previewMode, setPreviewMode] = useState("mobile"); // "mobile" or "desktop"
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleOpenAdd = () => {
    setForm(EMPTY_BANNER);
    setEditId(null);
    setUploadProgress(0);
    setModalOpen(true);
  };

  const handleOpenEdit = (row) => {
    setForm({
      caption: row.caption || "",
      imageUrl: row.imageUrl || "",
      creditText: row.creditText || "Website made by Wayzentech: 9398724704",
      buttonText: row.buttonText || "Next Go To Website",
      buttonUrl: row.buttonUrl || "",
      active: row.active ?? true
    });
    setEditId(row.id);
    setUploadProgress(0);
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);
    try {
      // Compresses to max 300kb automatically inside uploadToImgBB
      const url = await uploadToImgBB(file, (p) => setUploadProgress(p));
      setForm((f) => ({ ...f, imageUrl: url }));
      showToast("Image uploaded and compressed successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.caption.trim() || !form.imageUrl.trim()) {
      showToast("Caption and image are required");
      return;
    }

    setSaving(true);
    try {
      const bannerId = editId || crypto.randomUUID();
      const ref = doc(db, "festivals", bannerId);
      
      const payload = {
        id: bannerId,
        caption: form.caption.trim(),
        imageUrl: form.imageUrl.trim(),
        creditText: form.creditText.trim(),
        buttonText: form.buttonText.trim(),
        buttonUrl: form.buttonUrl.trim(),
        active: form.active,
        updatedAt: serverTimestamp()
      };

      if (!editId) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(ref, payload, { merge: true });
      setModalOpen(false);
      showToast(editId ? "Banner updated!" : "New banner created!");
    } catch (err) {
      console.error(err);
      showToast("Failed to save banner.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      await deleteDoc(doc(db, "festivals", id));
      showToast("Banner deleted successfully.");
    } catch (err) {
      showToast("Failed to delete banner.");
    }
  };

  const handleToggleStatus = async (row) => {
    try {
      await updateDoc(doc(db, "festivals", row.id), {
        active: !row.active,
        updatedAt: serverTimestamp()
      });
      showToast(`Banner status updated.`);
    } catch (err) {
      showToast("Failed to toggle status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-5xl text-white">FESTIVAL BANNERS</h1>
          <p className="mt-2 text-sm text-white/55">Redesign visual announcement banners for the public landing pages.</p>
        </div>
        <Button icon={Plus} onClick={handleOpenAdd}>Add Banner</Button>
      </div>

      {/* List Table */}
      <Card hover={false}>
        {loading ? (
          <p className="py-8 text-center text-white/45">Loading banners...</p>
        ) : festivals.length === 0 ? (
          <p className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-lg">No banners configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-white/10 text-white/42 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em]">
                  <th className="px-4 py-3">Banner Preview</th>
                  <th className="px-4 py-3">Caption / Title</th>
                  <th className="px-4 py-3">Credit Text</th>
                  <th className="px-4 py-3">Action Button</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {festivals.map((row) => (
                  <tr key={row.id} className="border-b border-white/7 align-middle">
                    <td className="px-4 py-3">
                      <div className="h-12 w-24 overflow-hidden rounded border border-white/10 bg-captain-black/40">
                        <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{row.caption}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">{row.creditText}</td>
                    <td className="px-4 py-3 text-xs">
                      {row.buttonUrl ? (
                        <a href={row.buttonUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-captain-bright hover:underline">
                          {row.buttonText} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-white/30">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => handleToggleStatus(row)}>
                        <Badge tone={row.active ? "green" : "grey"}>
                          {row.active ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(row)}
                          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:border-captain-gold hover:text-captain-gold transition"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="grid h-9 w-9 place-items-center rounded-full border border-red-400/30 text-red-300 hover:border-red-500 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Editor Dialog containing Form and Live Frame Preview */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Festival Banner" : "Add Festival Banner"}>
        <div className="grid gap-6 lg:grid-cols-2 text-sm text-white/70">
          {/* Form Controls */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-white/55">Banner Caption *</label>
              <input
                required
                type="text"
                className="form-input w-full"
                placeholder="e.g. Weekend Captain Carnival"
                value={form.caption}
                onChange={(e) => setForm(f => ({ ...f, caption: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/55">Banner Image *</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  className="form-input flex-1"
                  placeholder="URL or Upload Image"
                  value={form.imageUrl}
                  onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                />
                <label className="relative cursor-pointer rounded-full border border-captain-gold bg-captain-gold/10 px-4 py-2.5 font-nav text-xs font-extrabold uppercase tracking-wider text-captain-gold hover:bg-captain-gold hover:text-captain-black transition flex items-center justify-center shrink-0">
                  <UploadCloud size={14} className="mr-1.5" />
                  {uploading ? `${uploadProgress}%` : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploading}
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/55">Website Credit Text</label>
              <input
                type="text"
                className="form-input w-full font-mono text-xs"
                placeholder="Website made by Wayzentech: 9398724704"
                value={form.creditText}
                onChange={(e) => setForm(f => ({ ...f, creditText: e.target.value }))}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/55">Button Text</label>
                <input
                  type="text"
                  className="form-input w-full"
                  placeholder="Next Go To Website"
                  value={form.buttonText}
                  onChange={(e) => setForm(f => ({ ...f, buttonText: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/55">Button URL / Link</label>
                <input
                  type="url"
                  className="form-input w-full"
                  placeholder="https://..."
                  value={form.buttonUrl}
                  onChange={(e) => setForm(f => ({ ...f, buttonUrl: e.target.value }))}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-white/70 select-none">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))}
                className="rounded border-white/20 text-captain-gold focus:ring-captain-gold"
              />
              Banner is Active
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Banner"}
              </Button>
            </div>
          </form>

          {/* Live Frame Preview */}
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between border-b border-white/5 pb-2">
              <span className="font-nav text-xs font-extrabold uppercase tracking-wider text-captain-gold flex items-center gap-1">
                <Eye size={13} /> Live Frame Preview
              </span>
              <div className="flex rounded border border-white/10 p-0.5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded transition ${previewMode === "mobile" ? "bg-captain-gold text-captain-black" : "text-white/60"}`}
                  title="Mobile View (375px)"
                >
                  <Smartphone size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded transition ${previewMode === "desktop" ? "bg-captain-gold text-captain-black" : "text-white/60"}`}
                  title="Desktop View (1280px)"
                >
                  <Monitor size={14} />
                </button>
              </div>
            </div>

            {/* Frame View Container */}
            <div className="w-full overflow-x-auto flex justify-center bg-captain-black/80 rounded-lg p-4 border border-white/5 min-h-[300px]">
              <div
                style={{ width: previewMode === "mobile" ? "375px" : "100%" }}
                className={`transition-all duration-300 border border-dashed border-captain-gold/30 bg-captain-black/40 overflow-hidden flex flex-col justify-between`}
              >
                {/* Simulated Festival Banner */}
                <div className="flex flex-col border border-captain-gold/45 bg-captain-card overflow-hidden rounded shadow-gold-strong">
                  {form.imageUrl ? (
                    <div className="aspect-[21/9] w-full bg-captain-black overflow-hidden relative">
                      <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-[21/9] w-full bg-white/5 flex items-center justify-center text-white/20 text-xs">
                      No Image Selected
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div className="font-nav text-[10px] font-extrabold uppercase tracking-[0.2em] text-captain-gold">
                      Special Festival Event
                    </div>
                    <div className="font-serif text-lg font-bold text-white leading-snug">
                      {form.caption || "Special Carnival Offer"}
                    </div>
                    {form.creditText && (
                      <div className="text-[10px] text-white/45 italic leading-relaxed">
                        {form.creditText}
                      </div>
                    )}
                    {form.buttonUrl && (
                      <a
                        href={form.buttonUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-captain-gold hover:bg-captain-gold-hover px-4 py-2 font-nav text-xs font-extrabold uppercase tracking-wider text-captain-black transition"
                      >
                        {form.buttonText || "Go To Website"}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Toast message={toast} tone="green" />
    </div>
  );
}