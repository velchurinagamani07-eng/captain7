import { useState, useEffect, useMemo, useRef } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Clock, Eye, AlertTriangle, ShieldCheck } from "lucide-react";
import { db } from "../firebase.js";
import { useDocument } from "../hooks/useFirestore.js";

// Helper function to play a synthesized kitchen chime using Web Audio API
function playKitchenChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Tone 1: High crisp ding
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 880; // A5
    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.25);

    // Tone 2: Harmonious resonance
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 1046.50; // C6
      gain2.gain.setValueAtTime(0, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc2.start(audioCtx.currentTime);
      osc2.stop(audioCtx.currentTime + 0.35);
    }, 120);
  } catch (err) {
    console.warn("Audio chime failed to play:", err);
  }
}

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
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all"); // all, pending, preparing, ready
  const [activeConfirmation, setActiveConfirmation] = useState(null); // { order, nextStatus }
  
  // PIN access control state
  const { data: config } = useDocument("settings/tableOrderingConfig", { kitchenPin: "" });
  const [pinInput, setPinInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState("");

  const prevOrdersCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

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

  // Real-time listener for Active Dine-in orders
  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch active dine-in orders (exclude online delivery orders which do not have a tableNumber)
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["pending", "preparing", "ready"])
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        // Filter out online delivery orders (which lack a tableNumber)
        .filter((o) => o.tableNumber !== undefined);
      
      // Sort oldest first (highest priority)
      docs.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return aTime - bTime;
      });

      // Play chime when new orders arrive
      if (!isFirstLoadRef.current && docs.length > prevOrdersCountRef.current) {
        // Only chime if there is a new "pending" order
        const hasNewPending = docs.some(o => o.status === "pending" && !orders.some(x => x.id === o.id));
        if (hasNewPending) {
          playKitchenChime();
        }
      }

      setOrders(docs);
      prevOrdersCountRef.current = docs.length;
      isFirstLoadRef.current = false;
    });

    return unsubscribe;
  }, [isAuthenticated, orders]);

  // Statistics counters
  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const preparing = orders.filter((o) => o.status === "preparing").length;
    const ready = orders.filter((o) => o.status === "ready").length;
    return { pending, preparing, ready };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  // Update Firestore order status
  const handleUpdateStatus = async (order, nextStatus) => {
    try {
      const ref = doc(db, "orders", order.id);
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
    <div className="min-h-screen bg-[#070707] text-white p-4 font-sans selection:bg-captain-gold selection:text-captain-black">
      {/* Top Header stats bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
        <div>
          <div className="font-bebas text-captain-gold text-3xl tracking-widest flex items-center gap-2">
            C7 KITCHEN PANEL 🍳
          </div>
          <p className="text-xs text-white/45 uppercase tracking-[0.18em] font-bold">Real-time table orders dashboard</p>
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
      <div className="flex gap-2 border-b border-white/5 pb-4 mb-6">
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
            {tab === "all" ? "All Orders" : tab} ({tab === "all" ? orders.length : orders.filter(o => o.status === tab).length})
          </button>
        ))}
      </div>

      {/* Grid of Order Cards */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30 border border-dashed border-white/10 rounded-xl bg-captain-card">
          <Eye size={40} className="mb-3 opacity-40 text-captain-gold" />
          <p className="text-sm font-semibold tracking-wide">No active dine-in orders in this section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-captain-card border rounded-xl overflow-hidden shadow-lg transition-all flex flex-col justify-between ${
                order.status === "pending"
                  ? "border-red-500/30 shadow-red-500/5 animate-pulse"
                  : order.status === "preparing"
                  ? "border-amber-500/20"
                  : "border-green-500/25 opacity-75"
              }`}
            >
              {/* Card Header */}
              <div className="bg-captain-black/80 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-bebas text-captain-bright text-2xl font-bold tracking-wider leading-none">
                    TABLE {order.tableNumber}
                  </h3>
                  <div className="mt-1 font-mono text-[10px] text-white/40 font-bold">#{String(order.orderNumber).padStart(3, "0")}</div>
                </div>
                <div className="text-right">
                  <TimeAgo createdAt={order.createdAt} />
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 flex-1 space-y-3">
                {order.items?.map((it, i) => (
                  <div key={`${it.itemId}-${i}`} className="border-b border-white/5 pb-2.5 last:border-0 last:pb-0 flex items-start gap-2.5">
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

                {/* Overall Customer instructions note */}
                {order.customerNote && (
                  <div className="mt-4 p-2.5 bg-captain-black border border-captain-gold/15 rounded-lg">
                    <div className="text-[10px] uppercase font-nav font-bold tracking-wider text-captain-gold">Note for Chef:</div>
                    <p className="text-xs text-white/70 mt-1 italic leading-relaxed">"{order.customerNote}"</p>
                  </div>
                )}
              </div>

              {/* Card Footer Button */}
              <div className="p-4 bg-captain-black/30 border-t border-white/5">
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
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {activeConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-captain-charcoal border border-captain-gold/30 rounded-xl max-w-sm w-full p-6 text-center space-y-6 shadow-gold-strong">
            <div className="w-14 h-14 bg-captain-gold/10 border border-captain-gold/30 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="text-captain-bright" size={24} />
            </div>
            <div>
              <h4 className="font-bebas text-2xl text-white tracking-wide">Update Order Status</h4>
              <p className="text-white/60 text-xs mt-1">
                Mark Table <span className="text-captain-bright font-bold">{activeConfirmation.order.tableNumber}</span>'s order as{" "}
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
    </div>
  );
}

// Subcomponent to wrapper the live timer calculating elapsed order age
function TimeAgo({ createdAt }) {
  const { elapsedText, colorCode } = useTimeElapsed(createdAt);
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs ${colorCode}`}>
      <Clock size={12} /> {elapsedText || "Just now"}
    </span>
  );
}
