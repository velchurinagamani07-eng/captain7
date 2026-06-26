import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Edit3, Trash2, Calendar, Phone, User, Clock, DollarSign, FileText } from "lucide-react";
import { doc, setDoc, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase.js";
import { useCollection } from "../../hooks/useFirestore.js";
import { Modal } from "../../components/ui/Modal.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";

const ADDON_PRICES = {
  bat: { label: "Bat rental", price: 50 },
  helmet: { label: "Helmet", price: 30 },
  gloves: { label: "Batting gloves", price: 20 }
};

const EMPTY_FORM = {
  name: "",
  phone: "",
  date: new Date().toISOString().slice(0, 10),
  slotId: "",
  players: 6,
  addOns: [],
  amount: 0,
  paymentStatus: "paid",
  notes: ""
};

export default function AdminBookings() {
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [form, setForm] = useState(EMPTY_FORM);

  // Firestore collections
  const { data: bookings, loading: loadingBookings } = useCollection("bookings", [], { live: true });
  const { data: timeSlots, loading: loadingSlots } = useCollection("timeSlots", [], { live: true });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Filter bookings list
  const filteredBookings = useMemo(() => {
    const normalized = query.toLowerCase();
    const sorted = [...bookings].sort((a, b) => {
      const aTime = a.createdAt?.seconds ? a.createdAt.seconds : 0;
      const bTime = b.createdAt?.seconds ? b.createdAt.seconds : 0;
      return bTime - aTime;
    });
    if (!normalized) return sorted;
    return sorted.filter((b) => 
      (b.userName || "").toLowerCase().includes(normalized) ||
      (b.userPhone || "").toLowerCase().includes(normalized) ||
      (b.id || "").toLowerCase().includes(normalized)
    );
  }, [query, bookings]);

  // Handle slot selection to auto-calculate base price
  const selectedSlotObj = useMemo(() => {
    return timeSlots.find(s => s.id === form.slotId);
  }, [form.slotId, timeSlots]);

  // Compute total dynamically
  const calculatedTotal = useMemo(() => {
    const basePrice = selectedSlotObj?.price || 0;
    const addonsPrice = form.addOns.reduce((sum, key) => sum + (ADDON_PRICES[key]?.price || 0), 0);
    return basePrice + addonsPrice;
  }, [selectedSlotObj, form.addOns]);

  // Keep form amount in sync
  useEffect(() => {
    setForm(f => ({ ...f, amount: calculatedTotal }));
  }, [calculatedTotal]);

  const handleToggleAddon = (key) => {
    setForm(f => {
      const addOns = f.addOns.includes(key)
        ? f.addOns.filter(k => k !== key)
        : [...f.addOns, key];
      return { ...f, addOns };
    });
  };

  const handleOpenAdd = () => {
    setForm({
      ...EMPTY_FORM,
      date: new Date().toISOString().slice(0, 10),
      slotId: timeSlots[0]?.id || ""
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.slotId) {
      showToast("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const bookingId = `C7-M${Date.now().toString().slice(-5)}`;
      const selectedSlot = timeSlots.find(s => s.id === form.slotId);

      const bookingPayload = {
        id: bookingId,
        userId: "admin-manual",
        userName: form.name.trim(),
        userPhone: form.phone.trim(),
        date: form.date,
        slotId: form.slotId,
        startTime: selectedSlot?.startTime || "",
        endTime: selectedSlot?.endTime || "",
        players: Number(form.players),
        addOns: form.addOns,
        amount: Number(form.amount),
        paymentStatus: form.paymentStatus,
        status: "confirmed",
        notes: form.notes.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "bookings", bookingId), bookingPayload);
      
      setModalOpen(false);
      showToast("Booking manually created successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to save booking");
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async (id) => {
    if (!confirm("Are you sure you want to cancel and release this booking?")) return;
    try {
      await updateDoc(doc(db, "bookings", id), {
        status: "cancelled",
        updatedAt: serverTimestamp()
      });
      showToast("Booking released successfully.");
    } catch (err) {
      showToast("Failed to release booking.");
    }
  };

  const handleRefund = async (id) => {
    if (!confirm("Mark this booking as refunded?")) return;
    try {
      await updateDoc(doc(db, "bookings", id), {
        paymentStatus: "refunded",
        status: "cancelled",
        updatedAt: serverTimestamp()
      });
      showToast("Booking marked as refunded.");
    } catch (err) {
      showToast("Failed to refund booking.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Permanently delete this booking record?")) return;
    try {
      await deleteDoc(doc(db, "bookings", id));
      showToast("Booking record deleted.");
    } catch (err) {
      showToast("Failed to delete booking.");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-5xl text-white">BOOKINGS</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Manage confirmed, pending, cancelled, refunded, and manually released cricket bookings.
          </p>
        </div>
        <div>
          <Button icon={Plus} onClick={handleOpenAdd}>Add New</Button>
        </div>
      </div>

      {/* List Card */}
      <Card hover={false}>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-input w-full pl-11"
              placeholder="Search by ID, name, or phone"
            />
          </label>
          <div className="text-sm text-white/45">{filteredBookings.length} records</div>
        </div>

        {loadingBookings ? (
          <p className="py-12 text-center text-white/45">Loading bookings database...</p>
        ) : filteredBookings.length === 0 ? (
          <p className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-lg">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-y border-white/10 text-white/42 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em]">
                  <th className="px-3 py-3">Booking ID</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Time Slot</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="border-b border-white/7 hover:bg-white/[0.01]">
                    <td className="px-3 py-4 text-sm font-mono font-bold text-captain-bright">#{b.id}</td>
                    <td className="px-3 py-4 text-sm">
                      <div className="font-semibold text-white">{b.userName}</div>
                      <div className="text-white/45 text-xs">{b.userPhone}</div>
                    </td>
                    <td className="px-3 py-4 text-sm text-white/70">{b.date}</td>
                    <td className="px-3 py-4 text-sm text-white/70">
                      {b.startTime} - {b.endTime}
                    </td>
                    <td className="px-3 py-4 text-sm font-mono font-semibold text-white">
                      {formatCurrency(b.amount || 0)}
                    </td>
                    <td className="px-3 py-4 text-xs">
                      <Badge tone={b.paymentStatus === "paid" ? "green" : b.paymentStatus === "refunded" ? "grey" : "gold"}>
                        {b.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-xs">
                      <Badge tone={b.status === "confirmed" ? "green" : "grey"}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <div className="flex justify-end gap-2">
                        {b.status === "confirmed" && (
                          <button
                            type="button"
                            onClick={() => handleRelease(b.id)}
                            className="rounded-full border border-yellow-500/30 px-3 py-1.5 text-xs text-yellow-300 hover:border-yellow-500"
                          >
                            Release
                          </button>
                        )}
                        {b.paymentStatus === "paid" && (
                          <button
                            type="button"
                            onClick={() => handleRefund(b.id)}
                            className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs text-red-200 hover:border-red-400"
                          >
                            Refund
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id)}
                          className="rounded-full border border-red-600/30 px-2 py-1.5 text-xs text-red-400 hover:border-red-600"
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
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

      {/* Manual Booking Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Manually Add Booking">
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-sm text-white/70">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/55">Customer Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
                <input
                  required
                  type="text"
                  className="form-input w-full pl-10"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/55">Customer Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
                <input
                  required
                  type="tel"
                  className="form-input w-full pl-10"
                  placeholder="90004 69552"
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/55">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
                <input
                  required
                  type="date"
                  className="form-input w-full pl-10"
                  value={form.date}
                  onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/55">Time Slot *</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
                <select
                  required
                  className="form-input w-full pl-10"
                  value={form.slotId}
                  onChange={(e) => setForm(f => ({ ...f, slotId: e.target.value }))}
                >
                  <option value="" disabled>Select Time Slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.startTime} - {slot.endTime} ({formatCurrency(slot.price)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/55">Number of Players</label>
              <input
                type="number"
                min="2"
                max="12"
                className="form-input w-full"
                value={form.players}
                onChange={(e) => setForm(f => ({ ...f, players: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/55">Payment Status</label>
              <select
                className="form-input w-full"
                value={form.paymentStatus}
                onChange={(e) => setForm(f => ({ ...f, paymentStatus: e.target.value }))}
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Add-ons */}
          <div>
            <label className="mb-2 block text-xs text-white/55">Add-ons</label>
            <div className="grid gap-3 md:grid-cols-3">
              {Object.entries(ADDON_PRICES).map(([key, details]) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                    form.addOns.includes(key)
                      ? "border-captain-gold bg-captain-gold/10 text-white"
                      : "border-white/10 bg-captain-black/40 text-white/50"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{details.label}</span>
                    <span className="text-[10px] text-white/40">+{formatCurrency(details.price)}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.addOns.includes(key)}
                    onChange={() => handleToggleAddon(key)}
                    className="rounded border-white/20 text-captain-gold focus:ring-captain-gold"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Dynamic Amount calculation */}
          <div>
            <label className="mb-1 block text-xs text-white/55">Booking Cost (calculated total)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
              <input
                type="number"
                className="form-input w-full pl-10 bg-white/5 cursor-not-allowed font-semibold text-captain-bright"
                value={form.amount}
                readOnly
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs text-white/55">Internal Notes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-white/35" size={16} />
              <textarea
                className="form-input w-full pl-10 min-h-16"
                placeholder="Special details, requests, etc."
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create Booking"}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toast} tone="green" />
    </div>
  );
}
