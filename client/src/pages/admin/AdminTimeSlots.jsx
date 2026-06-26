import { useState } from "react";
import { Edit3, Copy, Ban, Plus, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { useAdminCollection } from "../../hooks/useAdminCollection.js";
import { timeSlots } from "../../data/siteData.js";

const EMPTY = { id: "", startTime: "", endTime: "", duration: "60 min", price: "", maxPlayers: 12, status: "active" };
const STATUSES = ["active", "reserved", "booked", "blocked"];

export default function AdminTimeSlots() {
  const { data, loading, saving, save, remove } = useAdminCollection("timeSlots", "startTime");
  const rows = data.length ? data : timeSlots;

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }
  function openAdd() { setForm(EMPTY); setEditId(null); setModal(true); }
  function openEdit(row) {
    setForm({ id: row.id, startTime: row.startTime, endTime: row.endTime, duration: row.duration || "60 min", price: row.price, maxPlayers: row.maxPlayers || 12, status: row.status || "active" });
    setEditId(row.id); setModal(true);
  }

  async function handleSave() {
    if (!form.startTime || !form.endTime || !form.price) return showToast("Start time, end time and price are required");
    const id = editId || form.id || `slot-${form.startTime.replace(/[^0-9]/g, "")}`;
    await save(editId ? editId : null, { ...form, price: Number(form.price), maxPlayers: Number(form.maxPlayers), id });
    setModal(false); showToast(editId ? "Updated!" : "Slot added!");
  }

  async function handleDuplicate(row) {
    const newId = `${row.id}-copy-${Date.now()}`;
    await save(null, { ...row, id: newId, status: "active" });
    showToast("Slot duplicated!");
  }

  async function handleBlock(row) {
    await save(row.id, { ...row, status: row.status === "blocked" ? "active" : "blocked" });
    showToast(row.status === "blocked" ? "Unblocked!" : "Blocked!");
  }

  async function handleDelete(id) {
    if (!confirm("Delete this slot?")) return;
    await remove(id); showToast("Deleted!");
  }

  const filtered = rows.filter((r) =>
    search === "" || r.id?.toLowerCase().includes(search.toLowerCase()) || r.startTime?.includes(search) || r.status?.includes(search)
  );

  const badgeTone = (status) => {
    if (status === "active") return "green";
    if (status === "booked") return "gold";
    if (status === "blocked") return "red";
    return "grey";
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-5xl text-white">TIME SLOTS</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Create recurring slots, block maintenance periods, detect overlap conflicts, and release reservations.</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add New</Button>
      </div>

      <Card hover={false}>
        <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
          <input
            className="form-input flex-1"
            placeholder="Search time slots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-sm text-white/45">{filtered.length} records</span>
        </div>

        {loading ? <p className="py-8 text-center text-white/45">Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-y border-white/10">
                  {["Slot ID", "Start", "End", "Price", "Max Players", "Status", "Actions"].map((h) => (
                    <th key={h} className={`px-3 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/42 ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-white/7">
                    <td className="px-3 py-4 font-mono text-sm text-white/80">{row.id}</td>
                    <td className="px-3 py-4 text-sm text-white/68">{row.startTime}</td>
                    <td className="px-3 py-4 text-sm text-white/68">{row.endTime}</td>
                    <td className="px-3 py-4 text-sm text-white/68">₹{row.price}</td>
                    <td className="px-3 py-4 text-sm text-white/68">{row.maxPlayers}</td>
                    <td className="px-3 py-4"><Badge tone={badgeTone(row.status)}>{row.status}</Badge></td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => handleDuplicate(row)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60 hover:border-captain-gold hover:text-captain-gold">
                          <Copy size={13} className="inline mr-1" />Duplicate
                        </button>
                        <button type="button" onClick={() => handleBlock(row)} className={`rounded-full border px-3 py-2 text-xs transition ${row.status === "blocked" ? "border-emerald-400/40 text-emerald-300" : "border-white/10 text-white/60 hover:border-red-400 hover:text-red-300"}`}>
                          <Ban size={13} className="inline mr-1" />{row.status === "blocked" ? "Unblock" : "Block"}
                        </button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Slot" : "Add Slot"}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-white/55">Slot ID</label>
              <input className="form-input w-full" value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="slot-11" disabled={!!editId} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/55">Start Time</label>
              <input className="form-input w-full" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} placeholder="11:00 AM" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/55">End Time</label>
              <input className="form-input w-full" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} placeholder="12:00 PM" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/55">Price (₹)</label>
              <input className="form-input w-full" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="699" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/55">Max Players</label>
              <input className="form-input w-full" type="number" value={form.maxPlayers} onChange={(e) => setForm((f) => ({ ...f, maxPlayers: e.target.value }))} placeholder="12" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-white/55">Status</label>
              <select className="form-input w-full" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
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