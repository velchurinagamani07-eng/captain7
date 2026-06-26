import { useEffect, useMemo, useRef, useState } from "react";
import { 
  CheckCircle, 
  LogOut, 
  MapPin, 
  MessageSquare, 
  Navigation, 
  Phone, 
  ShoppingBag, 
  User, 
  Bell, 
  Check, 
  FileText 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  doc, 
  serverTimestamp, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  writeBatch 
} from "firebase/firestore";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { Toast } from "../components/ui/Toast.jsx";
import { BrandMark } from "../components/common/BrandMark.jsx";
import { db } from "../firebase.js";
import { useAuth } from "../hooks/useAuth.js";
import { useCollection } from "../hooks/useFirestore.js";
import { brand } from "../data/siteData.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { googleMapsSearchUrl } from "../utils/maps.js";
import { openCustomerWhatsApp } from "../utils/whatsapp.js";

const activeStatuses = ["assigned", "accepted", "picked_up", "out_for_delivery"];

function formatStatus(status = "") {
  return status.replace(/_/g, " ");
}

function rupees(value) {
  return `Rs ${Math.round(Number(value || 0))}`;
}

function itemsText(order) {
  return order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ") || "";
}

function getBadgeTone(status) {
  if (status === "delivered") return "green";
  if (status === "assigned") return "gold";
  if (status === "accepted") return "blue";
  if (status === "picked_up" || status === "out_for_delivery") return "blue";
  return "grey";
}

function nextAction(order) {
  if (order.status === "assigned") return { label: "Accept", status: "accepted", timestamp: "acceptedAt" };
  if (order.status === "accepted") return { label: "Picked Up", status: "picked_up", timestamp: "pickedUpAt" };
  if (order.status === "picked_up") return { label: "Out for Delivery", status: "out_for_delivery", timestamp: null };
  if (order.status === "out_for_delivery") return { label: "Delivered", status: "delivered", timestamp: "deliveredAt" };
  return null;
}

// Helper function to play a synthesized notification chime using the browser's Web Audio API
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Tone 1
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 523.25; // C5
    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);

    // Tone 2 (shifted slightly later for a sweet bell ring effect)
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 659.25; // E5
      gain2.gain.setValueAtTime(0, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      
      osc2.start(audioCtx.currentTime);
      osc2.stop(audioCtx.currentTime + 0.35);
    }, 100);
  } catch (err) {
    console.warn("Chime failed to play:", err);
  }
}

export default function WorkerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const { data: allOrders, loading, error } = useCollection("orders", [], { live: true });

  const assignedOrders = useMemo(() => {
    if (!user?.uid) return [];
    return allOrders.filter((order) => order.assignedTo === user.uid);
  }, [allOrders, user]);

  const stats = useMemo(() => {
    return assignedOrders.reduce(
      (summary, order) => {
        summary.total += 1;
        if (order.status === "delivered") {
          summary.delivered += 1;
          const orderDate = order.deliveredAt?.seconds
            ? new Date(order.deliveredAt.seconds * 1000)
            : order.deliveredAt?.toDate
              ? order.deliveredAt.toDate()
              : order.deliveredAt
                ? new Date(order.deliveredAt)
                : null;
          const today = new Date();
          if (orderDate && orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear()) {
            summary.monthDelivered += 1;
          }
        } else if (activeStatuses.includes(order.status)) {
          summary.pending += 1;
        }
        return summary;
      },
      { total: 0, delivered: 0, pending: 0, monthDelivered: 0 }
    );
  }, [assignedOrders]);

  function triggerToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }

  const handleSignOut = async () => {
    await logout();
    navigate("/worker/login");
  };

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const prevCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  // Real-time listener for notifications for this worker
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "notifications"),
      where("targetRole", "==", "worker"),
      where("targetUid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(25)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(docs);

      const unreadCount = docs.filter((n) => !n.isRead).length;

      // Play chime only if unread count increases AND it's not the initial component mount
      if (!isFirstLoadRef.current && unreadCount > prevCountRef.current) {
        playChime();
      }

      prevCountRef.current = unreadCount;
      isFirstLoadRef.current = false;
    });

    return unsubscribe;
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (notifId) => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { isRead: true });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.isRead) {
          batch.update(doc(db, "notifications", n.id), { isRead: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  function acceptanceMessage(order) {
    const address = order.fullAddress || order.customerAddress || "";
    return `Captain 7: Your order #${order.id} has been accepted and will be delivered in 10 minutes! Track: maps.google.com/?q=${encodeURIComponent(address)}`;
  }

  function receiptMessage(order, workerName) {
    const origin = window.location.origin;
    return `Captain 7 Receipt

Order ID: #${order.id}
Invoice Link: ${origin}/invoice/${order.id}

Items: ${itemsText(order)}

Subtotal: ${rupees(order.subtotal)}

GST: ${rupees(order.gst)}

Total: ${rupees(order.total)}

Delivered by: ${workerName}

Thank you for ordering from Captain 7!`;
  }

  const handleUpdateStatus = async (order) => {
    const action = nextAction(order);
    if (!action) return;

    setUpdatingId(order.id);
    try {
      const orderRef = doc(db, "orders", order.id);
      const workerName = user?.name || order.workerName || "Captain 7";
      const updates = {
        status: action.status,
        workerName,
        updatedAt: serverTimestamp()
      };

      if (action.timestamp) updates[action.timestamp] = serverTimestamp();

      if (action.status === "delivered") {
        const deliveryTime = new Date().toISOString();
        updates.receiptSent = true;
        updates.receipt = {
          orderId: order.id,
          items: order.items || [],
          subtotal: order.subtotal || 0,
          gst: order.gst || 0,
          discount: order.discount || 0,
          total: order.total || 0,
          workerName,
          deliveryTime
        };
      }

      await updateDoc(orderRef, updates);

      if (action.status === "accepted") {
        openCustomerWhatsApp(order.customerPhone, acceptanceMessage(order));
      }
      if (action.status === "delivered") {
        openCustomerWhatsApp(order.customerPhone, receiptMessage(order, workerName));
      }

      triggerToast(`Order status updated to ${formatStatus(action.status)}`);
    } catch (error) {
      triggerToast(error.message || "Failed to update order status");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="min-h-screen bg-captain-black text-white">
      <header className="sticky top-0 z-30 border-b border-captain-gold/20 bg-captain-black/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" withText={false} />
            <div>
              <div className="font-bebas text-2xl tracking-wider text-captain-bright">Worker Dashboard</div>
              <div className="text-xs text-white/50">Welcome back, {user?.name || "Worker"}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 rounded-full border border-white/10 hover:border-captain-gold text-white/70 hover:text-white transition"
                aria-label="Open notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 font-mono text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-lg border border-captain-gold/25 bg-captain-charcoal p-2 shadow-gold-strong z-50 text-left">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 px-2 text-[10px] uppercase tracking-wider font-semibold text-white/60">
                    <span>Notifications ({unreadCount} unread)</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-captain-bright hover:underline text-[10px]"
                      >
                        Mark all
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-white/40">No notifications yet.</div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notif) => {
                        const date = notif.createdAt?.seconds 
                          ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : "Just now";
                        return (
                          <div
                            key={notif.id}
                            className={`p-2 rounded-lg border transition ${
                              notif.isRead
                                ? "border-white/5 bg-transparent opacity-60"
                                : "border-captain-gold/15 bg-captain-gold/5"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-[11px] text-white">{notif.title}</span>
                              <span className="text-[9px] text-white/40">{date}</span>
                            </div>
                            <p className="text-[11px] text-white/70 mt-1 leading-relaxed">{notif.message}</p>
                            {!notif.isRead && (
                              <div className="mt-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => markAsRead(notif.id)}
                                  className="text-white/40 hover:text-white"
                                  title="Mark as read"
                                >
                                  <Check size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:border-red-400 hover:text-red-300"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h2 className="font-bebas text-4xl tracking-wider text-white">My Deliveries</h2>
          <p className="text-sm text-white/52">Assigned food orders and delivery status updates.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total Orders Received" value={stats.total} />
          <Stat label="Total Delivered" value={stats.delivered} />
          <Stat label="Pending Orders" value={stats.pending} />
          <Stat label="This Month Delivered" value={stats.monthDelivered} />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
            Could not load assigned orders: {error}
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : assignedOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-captain-card py-20 text-center">
            <ShoppingBag className="mx-auto mb-3 text-white/20" size={36} />
            <p className="text-white/40">No orders assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {assignedOrders.map((order) => {
              const address = order.fullAddress || order.customerAddress || "";
              const action = nextAction(order);
              return (
                <Card key={order.id} hover={false} className="flex flex-col justify-between space-y-4 border border-white/10 bg-captain-card p-5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="font-mono text-sm font-bold text-captain-bright">#{order.id}</span>
                    <Badge tone={getBadgeTone(order.status)}>{formatStatus(order.status)}</Badge>
                  </div>

                  <div className="space-y-3 text-sm text-white/70">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-captain-gold" />
                      <span className="font-semibold text-white">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-captain-gold" />
                      <span>{order.customerPhone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-captain-gold" />
                      <div>
                        <div>{address}</div>
                        <a
                          href={googleMapsSearchUrl(address)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 rounded-full border border-captain-gold/40 px-3 py-1.5 text-xs font-semibold text-captain-bright"
                        >
                          <Navigation size={12} /> Open in Google Maps
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-y border-white/5 py-3 text-xs">
                    <span className="block uppercase tracking-wider text-white/40">Items Ordered</span>
                    {order.items?.map((item) => (
                      <div key={`${item.id}-${item.name}`} className="flex justify-between text-white/80">
                        <span>{item.name} <span className="text-white/40">x{item.quantity}</span></span>
                        <span className="font-mono">{formatCurrency(item.lineTotal || item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-mono text-sm font-bold text-captain-bright">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  {order.status === "delivered" ? (
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle size={14} /> Delivered
                      </span>
                      <div className="flex gap-2">
                        <a
                          href={`/invoice/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 hover:border-captain-gold px-3 py-2 text-xs font-semibold text-white hover:text-captain-gold transition"
                        >
                          <FileText size={13} /> Invoice
                        </a>
                        <button
                          type="button"
                          onClick={() => openCustomerWhatsApp(order.customerPhone, receiptMessage(order, user?.name || order.workerName || "Captain 7"))}
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                        >
                          <MessageSquare size={13} /> WhatsApp Receipt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Button disabled={updatingId === order.id || !action} onClick={() => handleUpdateStatus(order)} className="w-full text-xs">
                      {updatingId === order.id ? <Spinner /> : action?.label || "Waiting"}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Toast message={toast} tone="green" />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <Card hover={false} className="border border-captain-gold/20 bg-captain-card p-4">
      <div className="font-nav text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div className="mt-2 font-bebas text-4xl text-captain-bright">{value}</div>
    </Card>
  );
}
