import { useMemo, useState } from "react";
import { Mail, Pencil, Phone, Trash2, UserPlus } from "lucide-react";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useCollection } from "../../hooks/useFirestore.js";
import { apiRequest } from "../../utils/api.js";

const activeStatuses = ["assigned", "accepted", "picked_up", "out_for_delivery"];

export default function AdminWorkers() {
  const { getToken } = useAuth();
  const [toast, setToast] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [editingUid, setEditingUid] = useState("");
  const [editValues, setEditValues] = useState({ name: "", phone: "" });
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const { data: allUsers, loading: loadingUsers } = useCollection("users", [], { live: true });
  const { data: allOrders, loading: loadingOrders } = useCollection("orders", [], { live: true });

  const workers = useMemo(() => allUsers.filter((user) => user.role === "worker"), [allUsers]);

  const workerStats = useMemo(() => {
    const today = new Date();
    const statsMap = {};
    workers.forEach((worker) => {
      statsMap[worker.uid] = { active: 0, thisMonth: 0, allTime: 0 };
    });

    allOrders.forEach((order) => {
      const workerId = order.assignedTo;
      if (!workerId || !statsMap[workerId]) return;

      if (activeStatuses.includes(order.status)) {
        statsMap[workerId].active += 1;
      }

      if (order.status === "delivered") {
        statsMap[workerId].allTime += 1;
        const deliveredAt = order.deliveredAt?.toDate
          ? order.deliveredAt.toDate()
          : order.deliveredAt?.seconds
            ? new Date(order.deliveredAt.seconds * 1000)
            : order.deliveredAt
              ? new Date(order.deliveredAt)
              : null;
        if (deliveredAt && deliveredAt.getMonth() === today.getMonth() && deliveredAt.getFullYear() === today.getFullYear()) {
          statsMap[workerId].thisMonth += 1;
        }
      }
    });

    return statsMap;
  }, [allOrders, workers]);

  function triggerToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function withAdminToken(action) {
    const token = await getToken();
    return action(token);
  }

  const handleCreateWorker = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      triggerToast("All worker fields are required");
      return;
    }
    if (form.password.length < 6) {
      triggerToast("Password must be at least 6 characters");
      return;
    }

    setLoadingAction(true);
    try {
      await withAdminToken((token) => apiRequest("/api/workers", { token, method: "POST", body: form }));
      triggerToast("Worker account created");
      setForm({ name: "", email: "", phone: "", password: "" });
    } catch (error) {
      triggerToast(error.message || "Worker creation failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const startEdit = (worker) => {
    setEditingUid(worker.uid);
    setEditValues({ name: worker.name || "", phone: worker.phone || "" });
  };

  const saveEdit = async (uid) => {
    if (!editValues.name || !editValues.phone) {
      triggerToast("Name and phone are required");
      return;
    }

    setLoadingAction(true);
    try {
      await withAdminToken((token) => apiRequest(`/api/workers/${uid}`, { token, method: "PUT", body: editValues }));
      setEditingUid("");
      triggerToast("Worker updated");
    } catch (error) {
      triggerToast(error.message || "Worker update failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const deleteWorker = async (worker) => {
    const confirmed = window.confirm(`Delete worker ${worker.name}? This removes the Firebase Auth user and Firestore profile.`);
    if (!confirmed) return;

    setLoadingAction(true);
    try {
      await withAdminToken((token) => apiRequest(`/api/workers/${worker.uid}`, { token, method: "DELETE" }));
      triggerToast("Worker deleted");
    } catch (error) {
      triggerToast(error.message || "Worker deletion failed");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-5xl text-white">WORKER MANAGEMENT</h1>
        <p className="mt-2 text-sm text-white/55">Create workers, edit contact details, remove accounts, and monitor delivery stats.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card hover={false} className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-white">Workers</h2>
          {loadingUsers || loadingOrders ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : workers.length === 0 ? (
            <p className="py-12 text-center text-white/40">No workers registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] border-collapse text-left text-sm text-white/70">
                <thead>
                  <tr className="border-b border-white/10 text-white/45">
                    <th className="px-2 py-3 font-nav text-[11px] font-extrabold uppercase tracking-widest">Worker</th>
                    <th className="px-2 py-3 font-nav text-[11px] font-extrabold uppercase tracking-widest">Contact</th>
                    <th className="px-2 py-3 text-center font-nav text-[11px] font-extrabold uppercase tracking-widest">Active Orders</th>
                    <th className="px-2 py-3 text-center font-nav text-[11px] font-extrabold uppercase tracking-widest">This Month</th>
                    <th className="px-2 py-3 text-center font-nav text-[11px] font-extrabold uppercase tracking-widest">All Time</th>
                    <th className="px-2 py-3 text-right font-nav text-[11px] font-extrabold uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => {
                    const stats = workerStats[worker.uid] || { active: 0, thisMonth: 0, allTime: 0 };
                    const editing = editingUid === worker.uid;
                    return (
                      <tr key={worker.uid} className="border-b border-white/5 align-top">
                        <td className="px-2 py-4">
                          {editing ? (
                            <input
                              value={editValues.name}
                              onChange={(event) => setEditValues((current) => ({ ...current, name: event.target.value }))}
                              className="form-input w-full py-2"
                            />
                          ) : (
                            <>
                              <div className="font-medium text-white">{worker.name}</div>
                              <div className="text-xs text-white/40">UID: {worker.uid?.slice(0, 8)}...</div>
                            </>
                          )}
                        </td>
                        <td className="space-y-2 px-2 py-4">
                          {editing ? (
                            <input
                              value={editValues.phone}
                              onChange={(event) => setEditValues((current) => ({ ...current, phone: event.target.value }))}
                              className="form-input w-full py-2"
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5"><Phone size={13} className="text-captain-gold" />{worker.phone}</div>
                              <div className="flex items-center gap-1.5 text-xs"><Mail size={13} className="text-captain-gold" />{worker.email}</div>
                            </>
                          )}
                        </td>
                        <td className="px-2 py-4 text-center"><Badge tone={stats.active ? "gold" : "grey"}>{stats.active}</Badge></td>
                        <td className="px-2 py-4 text-center font-mono font-bold text-captain-bright">{stats.thisMonth}</td>
                        <td className="px-2 py-4 text-center font-mono font-bold text-white">{stats.allTime}</td>
                        <td className="px-2 py-4">
                          <div className="flex justify-end gap-2">
                            {editing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => saveEdit(worker.uid)}
                                  disabled={loadingAction}
                                  className="rounded-full border border-captain-gold px-3 py-2 text-xs text-captain-bright"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUid("")}
                                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEdit(worker)}
                                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/65 hover:border-captain-gold hover:text-captain-gold"
                                  aria-label={`Edit ${worker.name}`}
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteWorker(worker)}
                                  className="grid h-9 w-9 place-items-center rounded-full border border-red-400/30 text-red-200"
                                  aria-label={`Delete ${worker.name}`}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card hover={false} className="h-fit space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-captain-bright" />
            <h2 className="font-serif text-xl font-bold text-white">Create Worker</h2>
          </div>
          <form onSubmit={handleCreateWorker} className="space-y-4">
            <Field label="Name">
              <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} className="form-input w-full" />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} className="form-input w-full" />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} className="form-input w-full" />
            </Field>
            <Field label="Password">
              <input type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} className="form-input w-full" />
            </Field>
            <Button type="submit" className="w-full" disabled={loadingAction}>
              {loadingAction ? <Spinner /> : "Create Worker"}
            </Button>
          </form>
        </Card>
      </div>

      <Toast message={toast} tone="green" />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">{label}</span>
      {children}
    </label>
  );
}
