import { useMemo, useState } from "react";
import { ExternalLink, MapPin, ReceiptText, FileText } from "lucide-react";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { db } from "../../firebase.js";
import { useCollection } from "../../hooks/useFirestore.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { googleMapsSearchUrl } from "../../utils/maps.js";

const filters = ["all", "pending", "assigned", "accepted", "picked_up", "out_for_delivery", "delivered"];

function formatStatus(status = "pending") {
  return status.replace(/_/g, " ");
}

function getStatusTone(status) {
  if (status === "delivered") return "green";
  if (status === "pending") return "grey";
  if (status === "assigned") return "gold";
  return "blue";
}

function orderItemsText(order) {
  return order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ") || "";
}

export default function AdminOrders() {
  const [toast, setToast] = useState("");
  const [assigningId, setAssigningId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [receiptOrder, setReceiptOrder] = useState(null);
  const { data: orders, loading: loadingOrders } = useCollection("orders", [], { live: true, orderBy: "createdAt", direction: "desc" });
  const { data: users, loading: loadingUsers } = useCollection("users", [], { live: true });

  const workers = useMemo(() => users.filter((user) => user.role === "worker"), [users]);
  const visibleOrders = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((order) => order.status === statusFilter)),
    [orders, statusFilter]
  );

  function triggerToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }

  const handleAssignWorker = async (orderId, workerUid) => {
    if (!workerUid) return;
    const worker = workers.find((item) => item.uid === workerUid);
    if (!worker) return;

    setAssigningId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        assignedTo: workerUid,
        workerName: worker.name,
        status: "assigned",
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        type: "assigned_order",
        title: "New Delivery Assigned",
        message: `Order #${orderId} has been assigned to you for delivery.`,
        link: "/worker/dashboard",
        isRead: false,
        createdAt: serverTimestamp(),
        targetRole: "worker",
        targetUid: workerUid
      });

      triggerToast(`Order assigned to ${worker.name}`);
    } catch (error) {
      triggerToast(error.message || "Failed to assign worker");
    } finally {
      setAssigningId("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-5xl text-white">ORDER MANAGEMENT</h1>
        <p className="mt-2 text-sm text-white/55">Real-time food orders, worker assignment, maps, and delivery receipts.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-full px-4 py-2 font-nav text-xs font-extrabold uppercase tracking-[0.12em] ${
              statusFilter === filter ? "bg-captain-gold text-captain-black" : "border border-white/10 text-white/60"
            }`}
          >
            {formatStatus(filter)}
          </button>
        ))}
      </div>

      <Card hover={false} className="p-0">
        {loadingOrders || loadingUsers ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : visibleOrders.length === 0 ? (
          <div className="grid min-h-[260px] place-items-center text-center text-white/45">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/42">
                  <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em]">Order ID</th>
                  <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em]">Customer</th>
                  <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em]">Address</th>
                  <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em]">Items</th>
                  <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em]">Total</th>
                  <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em]">Status</th>
                  <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em]">Assigned Worker</th>
                  <th className="px-4 py-3 text-right font-nav text-[11px] font-extrabold uppercase tracking-[0.14em]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => {
                  const address = order.fullAddress || order.customerAddress || "";
                  return (
                    <tr key={order.id} className="border-b border-white/7 align-top text-white/68">
                      <td className="px-4 py-4 font-mono font-bold text-captain-bright">#{order.id}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">{order.customerName}</div>
                        <div className="mt-1 text-xs text-white/45">{order.customerPhone}</div>
                      </td>
                      <td className="max-w-[280px] px-4 py-4">
                        <div className="flex gap-2">
                          <MapPin size={15} className="mt-1 shrink-0 text-captain-gold" />
                          <div>
                            <div className="leading-6 text-white/72">{address}</div>
                            <a
                              href={googleMapsSearchUrl(address)}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 rounded-full border border-captain-gold/40 px-3 py-1.5 text-xs text-captain-bright"
                            >
                              <ExternalLink size={12} /> Maps
                            </a>
                            <div className="mt-2 rounded-lg border border-white/10 bg-captain-black p-2 text-xs text-white/45">
                              Map preview: {address}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[220px] px-4 py-4 text-xs leading-6">{orderItemsText(order)}</td>
                      <td className="px-4 py-4 font-mono font-bold text-white">{formatCurrency(order.total || 0)}</td>
                      <td className="px-4 py-4"><Badge tone={getStatusTone(order.status)}>{formatStatus(order.status)}</Badge></td>
                      <td className="px-4 py-4">
                        <div className="mb-2 text-white/75">{order.workerName || "Unassigned"}</div>
                        {order.status !== "delivered" ? (
                          <select
                            value=""
                            disabled={assigningId === order.id}
                            onChange={(event) => handleAssignWorker(order.id, event.target.value)}
                            className="form-input w-full min-w-40 py-2 text-xs"
                          >
                            <option value="" disabled>{order.assignedTo ? "Reassign Worker" : "Assign Worker"}</option>
                            {workers.map((worker) => (
                              <option key={worker.uid} value={worker.uid}>{worker.name}</option>
                            ))}
                          </select>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {order.status === "delivered" ? (
                            <>
                              <a
                                href={`/invoice/${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-white/20 hover:border-captain-gold px-3 py-2 text-xs text-white/70 hover:text-white"
                              >
                                <FileText size={14} /> Invoice
                              </a>
                              <button
                                type="button"
                                onClick={() => setReceiptOrder(order)}
                                className="inline-flex items-center gap-2 rounded-full border border-captain-gold/45 px-3 py-2 text-xs text-captain-bright"
                              >
                                <ReceiptText size={14} /> View Receipt
                              </button>
                            </>
                          ) : null}
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

      <Modal open={Boolean(receiptOrder)} onClose={() => setReceiptOrder(null)} title="Delivery Receipt">
        {receiptOrder ? (
          <div className="space-y-4 text-sm text-white/70">
            <div className="rounded-lg border border-captain-gold/25 bg-captain-black p-4">
              <div className="font-mono text-lg font-bold text-captain-bright">#{receiptOrder.id}</div>
              <div className="mt-1">Delivered by {receiptOrder.workerName || receiptOrder.receipt?.workerName || "Worker"}</div>
              <div className="mt-1">
                Delivery time:{" "}
                {receiptOrder.deliveredAt?.toDate
                  ? receiptOrder.deliveredAt.toDate().toLocaleString()
                  : receiptOrder.receipt?.deliveryTime || "Recorded"}
              </div>
            </div>
            <div>
              <div className="mb-2 font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-captain-gold">Items</div>
              {receiptOrder.items?.map((item) => (
                <div key={`${item.id}-${item.name}`} className="flex justify-between border-b border-white/7 py-2">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{formatCurrency(item.lineTotal || item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-2 rounded-lg border border-white/10 bg-captain-black p-4">
              <Row label="Subtotal" value={formatCurrency(receiptOrder.subtotal || 0)} />
              <Row label="GST" value={formatCurrency(receiptOrder.gst || 0)} />
              <Row label="Discount" value={`- ${formatCurrency(receiptOrder.discount || 0)}`} />
              <Row label="Total" value={formatCurrency(receiptOrder.total || 0)} strong />
            </div>
          </div>
        ) : null}
      </Modal>

      <Toast message={toast} tone="green" />
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex justify-between ${strong ? "font-mono text-lg font-bold text-captain-bright" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
