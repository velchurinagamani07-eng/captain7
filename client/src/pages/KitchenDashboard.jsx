import { useState, useEffect, useMemo, useRef } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { Clock, Eye, AlertTriangle, ShieldCheck, Volume2, Trash2 } from "lucide-react";
import { db } from "../firebase.js";
import { useDocument } from "../hooks/useFirestore.js";

// Live Timer hook to recalculate elapsed time every 15 seconds
function useTimeElapsed(createdAt) {
  const [elapsedText, setElapsedText] = useState("");
  const [colorCode, setColorCode] = useState("white"); // white, yellow, red

  useEffect(() => {
    if (!createdAt) return;
    const calculate = () => {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 8) {
        setElapsedText(`${diffMins} min ago`);
        setColorCode("text-white/60");
      } else if (diffMins < 15) {
        setElapsedText(`${diffMins} min ago`);
        setColorCode("text-yellow-500 font-bold");
      } else {
        setElapsedText(`${diffMins} MIN AGO! 🚨`);
        setColorCode("text-red-500 font-black animate-pulse");
      }
    };

    calculate();
    const interval = setInterval(calculate, 15000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return { elapsedText, colorCode };
}

export default function KitchenDashboard() {
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [tableOrders, setTableOrders] = useState([]);
  const [filter, setFilter] = useState("all"); // all, pending, preparing, ready
  const [activeConfirmation, setActiveConfirmation] = useState(null); // { order, nextStatus }
  const [deleteTargetOrder, setDeleteTargetOrder] = useState(null); // order object to delete
  
  // Audio Autoplay unlock state
  const soundEnabledRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // PIN access control state
  const { data: config } = useDocument("settings/tableOrderingConfig", { kitchenPin: "" });
  const [pinInput, setPinInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState("");

  const isFirstDeliveryLoad = useRef(true);
  const isFirstTableLoad = useRef(true);

  // Unlock browser audio on first user click/tap anywhere
  useEffect(() => {
    const unlockSound = () => {
      soundEnabledRef.current = true;
      setSoundEnabled(true);
      window.removeEventListener("click", unlockSound);
      window.removeEventListener("keydown", unlockSound);
      window.removeEventListener("touchstart", unlockSound);
    };

    window.addEventListener("click", unlockSound);
    window.addEventListener("keydown", unlockSound);
    window.addEventListener("touchstart", unlockSound);

    return () => {
      window.removeEventListener("click", unlockSound);
      window.removeEventListener("keydown", unlockSound);
      window.removeEventListener("touchstart", unlockSound);
    };
  }, []);

  const playSound = (path) => {
    if (!soundEnabledRef.current) return;
    try {
      const audio = new Audio(path);
      audio.play().catch((err) => console.log("Audio play error:", err));
    } catch (err) {
      console.log(err);
    }
  };

  // Authenticate kitchen screen
  useEffect(() => {
    if (!config.kitchenPin) {
      setIsAuthenticated(true);
    }
  }, [config.kitchenPin]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === config.kitchenPin || !config.kitchenPin) {
      setIsAuthenticated(true);
      setPinError("");
    } else {
      setPinError("Invalid PIN code. Please try again.");
      setPinInput("");
    }
  };

  // 1. Real-time listener for Delivery orders (`orders` collection)
  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(
      collection(db, "orders"),
      where("status", "in", ["pending", "preparing", "ready"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        _collection: "orders",
        isDelivery: true,
        ...d.data()
      }));

      if (!isFirstDeliveryLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            playSound("/1.mp4");
          }
        });
      }
      isFirstDeliveryLoad.current = false;
      setDeliveryOrders(docs);
    });

    return unsubscribe;
  }, [isAuthenticated]);

  // 2. Real-time listener for Dine-In Table orders (`tableOrders` collection)
  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(
      collection(db, "tableOrders"),
      where("status", "in", ["pending", "preparing", "ready"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        _collection: "tableOrders",
        isDelivery: false,
        ...d.data()
      }));

      if (!isFirstTableLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            playSound("/2.mp4");
          }
        });
      }
      isFirstTableLoad.current = false;
      setTableOrders(docs);
    });

    return unsubscribe;
  }, [isAuthenticated]);

  // Combine both delivery and dine-in orders into a single list sorted by createdAt (oldest first)
  const combinedOrders = useMemo(() => {
    const list = [...deliveryOrders, ...tableOrders];
    list.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return aTime - bTime;
    });
    return list;
  }, [deliveryOrders, tableOrders]);

  // Statistics counters
  const stats = useMemo(() => {
    const pending = combinedOrders.filter((o) => o.status === "pending").length;
    const preparing = combinedOrders.filter((o) => o.status === "preparing").length;
    const ready = combinedOrders.filter((o) => o.status === "ready").length;
    return { pending, preparing, ready };
  }, [combinedOrders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (filter === "all") return combinedOrders;
    return combinedOrders.filter((o) => o.status === filter);
  }, [combinedOrders, filter]);

  // Update Firestore order status in respective collection
  const handleUpdateStatus = async (order, nextStatus) => {
    try {
      const targetCollection = order._collection || (order.tableNumber ? "tableOrders" : "orders");
      const ref = doc(db, targetCollection, order.id);
      const updates = {
        status: nextStatus,
        updatedAt: serverTimestamp()
      };
      
      if (nextStatus === "preparing") {
        updates.kitchenAcceptedAt = serverTimestamp();
      } else if (nextStatus === "ready") {
        updates.readyAt = serverTimestamp();
      }

      await updateDoc(ref, updates);
      setActiveConfirmation(null);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating order status.");
    }
  };

  const handleDeleteOrder = async (order) => {
    try {
      const targetCollection = order._collection || (order.tableNumber ? "tableOrders" : "orders");
      await deleteDoc(doc(db, targetCollection, order.id));
      setDeleteTargetOrder(null);
    } catch (err) {
      console.error("Failed to delete order:", err);
      alert("Error deleting order: " + err.message);
    }
  };

  // 1. PIN verification screen
  if (!isAuthenticated && config.kitchenPin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-captain-black text-white px-4">
        <form onSubmit={handlePinSubmit} className="w-full max-w-sm bg-captain-card border border-captain-gold/30 rounded-xl p-6 shadow-gold space-y-6 text-center">
          <div className="w-16 h-16 bg-captain-gold/10 border border-captain-gold/35 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="text-captain-bright animate-pulse" size={28} />
          </div>
          <div>
            <h1 className="font-bebas text-3xl text-white tracking-wider">Kitchen Screen Access</h1>
            <p className="mt-1 text-white/50 text-xs">Enter the 4-digit security PIN to view active orders.</p>
          </div>
          <div className="space-y-2">
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full bg-captain-black border border-white/10 rounded-lg py-3 text-center text-xl font-mono tracking-[0.6em] text-captain-gold outline-none focus:border-captain-gold"
            />
            {pinError && <p className="text-red-500 text-xs font-bold">{pinError}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-captain-gold hover:bg-captain-gold/90 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider text-captain-black transition"
          >
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  // 2. Active Kitchen screen
  return (
    <div className="min-h-screen bg-[#070707] text-white p-4 font-sans selection:bg-captain-gold selection:text-captain-black space-y-4">
      {/* Sound unlock banner if muted */}
      {!soundEnabled && (
        <div
          onClick={() => {
            soundEnabledRef.current = true;
            setSoundEnabled(true);
          }}
          className="bg-captain-gold/20 border border-captain-gold text-captain-bright p-3 rounded-lg text-xs font-nav font-bold uppercase tracking-wider flex items-center justify-between cursor-pointer animate-pulse"
        >
          <div className="flex items-center gap-2">
            <Volume2 size={16} />
            <span>Sound notifications are muted. Click anywhere on this page to enable sound!</span>
          </div>
          <span className="bg-captain-gold text-captain-black px-2.5 py-1 rounded text-[10px]">Enable Sound</span>
        </div>
      )}

      {/* Top Header stats bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="font-bebas text-captain-gold text-3xl tracking-widest flex items-center gap-2">
            C7 KITCHEN PANEL 🍳
          </div>
          <p className="text-xs text-white/45 uppercase tracking-[0.18em] font-bold">Real-time order updates (Delivery 🛵 & Table 🍽️)</p>
        </div>

        {/* Real-time statistics counters */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-red-950/40 border border-red-500/20 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-white/60 text-xs uppercase font-extrabold tracking-wider">Pending:</span>
            <span className="text-red-400 font-mono font-bold text-lg">{stats.pending}</span>
          </div>
          <div className="bg-amber-950/40 border border-amber-500/20 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-white/60 text-xs uppercase font-extrabold tracking-wider">Cooking:</span>
            <span className="text-amber-400 font-mono font-bold text-lg">{stats.preparing}</span>
          </div>
          <div className="bg-green-950/40 border border-green-500/20 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-white/60 text-xs uppercase font-extrabold tracking-wider">Ready:</span>
            <span className="text-green-400 font-mono font-bold text-lg">{stats.ready}</span>
          </div>
        </div>
      </header>

      {/* Tabs Filter */}
      <div className="flex gap-2 border-b border-white/5 pb-4">
        {["all", "pending", "preparing", "ready"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-5 py-2.5 font-nav text-xs font-extrabold uppercase tracking-[0.14em] transition ${
              filter === tab
                ? "bg-captain-gold text-captain-black shadow-gold"
                : "bg-captain-card border border-white/5 text-white/55 hover:text-white"
            }`}
          >
            {tab === "all" ? "All Orders" : tab} ({tab === "all" ? combinedOrders.length : combinedOrders.filter(o => o.status === tab).length})
          </button>
        ))}
      </div>

      {/* Grid of Order Cards */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30 border border-dashed border-white/10 rounded-xl bg-captain-card">
          <Eye size={40} className="mb-3 opacity-40 text-captain-gold" />
          <p className="text-sm font-semibold tracking-wide">No active kitchen orders in this section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredOrders.map((order) => {
            const isDineIn = order.tableNumber !== undefined || order.source === "dine-in";
            return (
              <div
                key={`${order._collection}-${order.id}`}
                className={`bg-captain-card border rounded-xl overflow-hidden shadow-lg transition-all flex flex-col justify-between ${
                  order.status === "pending"
                    ? "border-red-500/30 shadow-red-500/5 animate-pulse"
                    : order.status === "preparing"
                    ? "border-amber-500/20"
                    : "border-green-500/25 opacity-75"
                }`}
              >
                {/* Card Header with Source Badge & Trash Delete Button */}
                <div className="bg-captain-black/80 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <div>
                    {isDineIn ? (
                      <div className="flex items-center gap-1.5 font-bebas text-captain-bright text-2xl font-bold tracking-wider leading-none">
                        <span>🍽️</span> TABLE {order.tableNumber}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 font-bebas text-blue-400 text-xl font-bold tracking-wider leading-none">
                        <span>🛵</span> DELIVERY ORDER
                      </div>
                    )}
                    <div className="mt-1 font-mono text-[10px] text-white/40 font-bold">
                      #{order.orderNumber ? String(order.orderNumber).padStart(3, "0") : String(order.id).slice(-5)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TimeAgo createdAt={order.createdAt} />
                    <button
                      type="button"
                      onClick={() => setDeleteTargetOrder(order)}
                      className="p-1.5 rounded bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white transition"
                      title="Delete / Cancel Order"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-3">
                  {order.items?.map((it, i) => (
                    <div key={`${it.itemId || it.id}-${i}`} className="border-b border-white/5 pb-2.5 last:border-0 last:pb-0 flex items-start gap-2.5">
                      {/* Veg indicator */}
                      <span className="mt-1.5 shrink-0 flex h-3.5 w-3.5 items-center justify-center bg-black/60 rounded p-0.5 border border-white/5">
                        <span className={`h-1.5 w-1.5 rounded-full ${it.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="font-bebas text-white text-xl tracking-wider">{it.name}</span>
                          <span className="font-mono text-captain-gold text-lg font-black shrink-0">×{it.quantity}</span>
                        </div>
                        {it.specialNote && (
                          <p className="text-xs text-captain-gold italic font-semibold mt-0.5">"{it.specialNote}"</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Customer instructions note */}
                  {(order.customerNote || order.customerName) && (
                    <div className="mt-4 p-2.5 bg-captain-black border border-captain-gold/15 rounded-lg">
                      <div className="text-[10px] uppercase font-nav font-bold tracking-wider text-captain-gold">
                        {order.customerName ? `Customer: ${order.customerName}` : "Note for Chef:"}
                      </div>
                      {order.customerNote && <p className="text-xs text-white/70 mt-1 italic leading-relaxed">"{order.customerNote}"</p>}
                    </div>
                  )}
                </div>

                {/* Card Footer Button */}
                <div className="p-4 bg-captain-black/30 border-t border-white/5 flex gap-2">
                  <div className="flex-1">
                    {order.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => setActiveConfirmation({ order, nextStatus: "preparing" })}
                        className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider text-white transition flex items-center justify-center gap-1.5"
                      >
                        <Clock size={14} /> Accept Order
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <button
                        type="button"
                        onClick={() => setActiveConfirmation({ order, nextStatus: "ready" })}
                        className="w-full bg-amber-500 hover:bg-amber-600 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider text-captain-black transition flex items-center justify-center gap-1.5"
                      >
                        <Clock size={14} /> Mark Ready
                      </button>
                    )}
                    {order.status === "ready" && (
                      <div className="w-full border border-green-500/35 bg-green-950/20 py-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-green-400 text-center">
                        Ready to Serve 🍽️
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetOrder(order)}
                    className="px-3 bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition flex items-center justify-center"
                    title="Delete Order"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Status Modal */}
      {activeConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-captain-charcoal border border-captain-gold/30 rounded-xl max-w-sm w-full p-6 text-center space-y-6 shadow-gold-strong">
            <div className="w-14 h-14 bg-captain-gold/10 border border-captain-gold/30 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="text-captain-bright" size={24} />
            </div>
            <div>
              <h4 className="font-bebas text-2xl text-white tracking-wide">Update Order Status</h4>
              <p className="text-white/60 text-xs mt-1">
                Mark {activeConfirmation.order.tableNumber ? `Table ${activeConfirmation.order.tableNumber}` : "Delivery Order"} as{" "}
                <span className="text-captain-gold font-bold uppercase tracking-wider">{activeConfirmation.nextStatus}</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleUpdateStatus(activeConfirmation.order, activeConfirmation.nextStatus)}
                className="flex-1 bg-captain-gold hover:bg-captain-gold/90 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider text-captain-black transition"
              >
                Yes, Update
              </button>
              <button
                type="button"
                onClick={() => setActiveConfirmation(null)}
                className="flex-1 bg-captain-black border border-white/10 hover:border-captain-gold py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetOrder && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[90] animate-fadeIn">
          <div className="bg-captain-charcoal border border-red-500/40 rounded-xl max-w-sm w-full p-6 text-center space-y-6 shadow-red-500/10">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="text-red-400" size={24} />
            </div>
            <div>
              <h4 className="font-bebas text-2xl text-white tracking-wide">Delete Order</h4>
              <p className="text-white/60 text-xs mt-1">
                Are you sure you want to permanently delete{" "}
                <span className="text-red-400 font-bold">
                  {deleteTargetOrder.tableNumber ? `Table ${deleteTargetOrder.tableNumber}` : `Delivery Order #${deleteTargetOrder.id}`}
                </span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleDeleteOrder(deleteTargetOrder)}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider text-white transition"
              >
                Yes, Delete Order
              </button>
              <button
                type="button"
                onClick={() => setDeleteTargetOrder(null)}
                className="flex-1 bg-captain-black border border-white/10 hover:border-white py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent to wrap the live timer calculating elapsed order age
function TimeAgo({ createdAt }) {
  const { elapsedText, colorCode } = useTimeElapsed(createdAt);
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs ${colorCode}`}>
      <Clock size={12} /> {elapsedText || "Just now"}
    </span>
  );
}
