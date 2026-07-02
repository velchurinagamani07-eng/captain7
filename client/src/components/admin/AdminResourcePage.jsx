import { useMemo, useState, useRef } from "react";
import { Edit3, Plus, Search, Trash2, UploadCloud } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { Card } from "../ui/Card.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Modal } from "../ui/Modal.jsx";
import { Toast } from "../ui/Toast.jsx";
import { useAdminCollection, uploadToImgBB } from "../../hooks/useAdminCollection.js";

export function AdminResourcePage({
  title,
  description,
  rows: initialRows = [],
  columns = [],
  actions = [],
  upload = false,
  collectionName,
  formFields = [],
  onSave,
  onDelete,
  onAction
}) {
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formState, setFormState] = useState({});
  const [uploadingField, setUploadingField] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState("");
  const fileInputRef = useRef(null);

  const { data: dbRows, loading, save, remove } = useAdminCollection(collectionName || "dummy", "createdAt");

  const activeRows = collectionName ? dbRows : initialRows;

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    if (!normalized) return activeRows;
    return activeRows.filter((row) =>
      Object.values(row)
        .map(v => typeof v === "object" ? "" : String(v))
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [query, activeRows]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleOpenAdd = () => {
    const defaultForm = {};
    formFields.forEach((field) => {
      defaultForm[field.key] = field.type === "boolean" ? false : field.type === "number" ? 0 : "";
    });
    setFormState(defaultForm);
    setEditId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (row) => {
    const editForm = {};
    formFields.forEach((field) => {
      editForm[field.key] = row[field.key] ?? (field.type === "boolean" ? false : field.type === "number" ? 0 : "");
    });
    setFormState(editForm);
    setEditId(row.id);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    for (const field of formFields) {
      if (field.required && !formState[field.key] && formState[field.key] !== 0) {
        showToast(`${field.label} is required`);
        return;
      }
    }

    try {
      const payload = { ...formState };
      formFields.forEach((field) => {
        if (field.type === "number") {
          payload[field.key] = Number(payload[field.key]) || 0;
        }
      });

      if (onSave) {
        await onSave(payload, editId);
      } else if (collectionName) {
        await save(editId, payload);
      }
      setModalOpen(false);
      showToast(editId ? "Updated successfully!" : "Created successfully!");
    } catch (err) {
      showToast(err.message || "Failed to save");
    }
  };

  const handleDelete = async (row) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      if (onDelete) {
        await onDelete(row);
      } else if (collectionName) {
        await remove(row.id);
      }
      showToast("Deleted successfully!");
    } catch (err) {
      showToast(err.message || "Failed to delete");
    }
  };

  const handleFileUpload = async (e, fieldKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldKey);
    setUploadProgress(10);
    try {
      const url = await uploadToImgBB(file, (p) => setUploadProgress(p));
      setFormState((f) => ({ ...f, [fieldKey]: url }));
      showToast("Image uploaded successfully!");
    } catch (err) {
      showToast("Upload failed: " + err.message);
    } finally {
      setUploadingField("");
      setUploadProgress(0);
    }
  };

  const isSaving = false; // Add state if needed, hook provides saving but keep it simple

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-5xl text-white">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {upload ? (
            <Button
              variant="secondary"
              icon={UploadCloud}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </Button>
          ) : null}
          {formFields.length > 0 && (
            <Button icon={Plus} onClick={handleOpenAdd}>
              Add New
            </Button>
          )}
        </div>
      </div>
      <Card hover={false}>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="form-input w-full pl-11"
              placeholder={`Search ${title.toLowerCase()}`}
            />
          </label>
          <div className="text-sm text-white/45">
            {collectionName && loading ? "Loading..." : `${filtered.length} records`}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-y border-white/10">
                {columns.map((column) => (
                  <th key={column.key} className="px-3 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/42">
                    {column.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-nav text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/42">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {collectionName && loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-8 text-center text-sm text-white/45">
                    Loading records from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-8 text-center text-sm text-white/45">
                    No records found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id || row.name || row.code} className="border-b border-white/7">
                    {columns.map((column) => (
                      <td key={column.key} className="px-3 py-4 text-sm text-white/68">
                        {column.badge ? (
                          <Badge
                            tone={
                              row[column.key] === "active" ||
                              row[column.key] === "confirmed" ||
                              row[column.key] === "pinned"
                                ? "green"
                                : "grey"
                            }
                          >
                            {row[column.key]}
                          </Badge>
                        ) : (
                          row[column.key]
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        {actions.map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => onAction?.(action, row)}
                            className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60 hover:border-captain-gold hover:text-captain-gold"
                          >
                            {action}
                          </button>
                        ))}
                        {formFields.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(row)}
                            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:border-captain-gold hover:text-captain-gold"
                            aria-label="Edit"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          className="grid h-9 w-9 place-items-center rounded-full border border-red-400/30 text-red-200 hover:border-red-500 hover:text-red-100"
                          aria-label="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? `Edit ${title}` : `Add New ${title}`}>
        <div className="flex flex-col gap-4 text-sm text-white/70">
          {formFields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <label className="text-xs text-white/55">
                {field.label} {field.required && "*"}
              </label>

              {field.type === "select" ? (
                <select
                  value={formState[field.key] || ""}
                  onChange={(e) => setFormState((f) => ({ ...f, [field.key]: e.target.value }))}
                  className="form-input w-full"
                  required={field.required}
                >
                  <option value="" disabled>Select {field.label}</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={formState[field.key] || ""}
                  onChange={(e) => setFormState((f) => ({ ...f, [field.key]: e.target.value }))}
                  className="form-input w-full"
                  rows={3}
                  required={field.required}
                />
              ) : field.type === "boolean" ? (
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formState[field.key])}
                    onChange={(e) => setFormState((f) => ({ ...f, [field.key]: e.target.checked }))}
                    className="rounded border-white/20 text-captain-gold focus:ring-captain-gold"
                  />
                  <span>Enabled</span>
                </label>
              ) : field.type === "image" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      value={formState[field.key] || ""}
                      onChange={(e) => setFormState((f) => ({ ...f, [field.key]: e.target.value }))}
                      className="form-input flex-1"
                      placeholder="Paste image URL or upload"
                    />
                    <label className="relative cursor-pointer rounded bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-white transition flex items-center justify-center shrink-0 border border-white/15">
                      {uploadingField === field.key ? `${uploadProgress}%` : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploadingField !== ""}
                        onChange={(e) => handleFileUpload(e, field.key)}
                      />
                    </label>
                  </div>
                  {formState[field.key] && (
                    <img src={formState[field.key]} alt="preview" className="mt-1 h-20 w-32 rounded object-cover border border-white/10" />
                  )}
                </div>
              ) : (
                <input
                  type={field.type || "text"}
                  value={formState[field.key] ?? ""}
                  onChange={(e) => setFormState((f) => ({ ...f, [field.key]: e.target.value }))}
                  className="form-input w-full"
                  required={field.required}
                  min={field.min}
                  max={field.max}
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || uploadingField !== ""}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Toast message={toast} tone="green" />
    </div>
  );
}
