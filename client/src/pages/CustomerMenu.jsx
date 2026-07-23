import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  serverTimestamp,
  runTransaction,
  onSnapshot
} from "firebase/firestore";
import { ShoppingBag, ChevronRight, Plus, Minus, Check, Clock, AlertTriangle, ArrowLeft } from "lucide-react";
import { db } from "../firebase.js";
import { menuCategories as staticCategories, menuItems as staticMenuItems } from "../data/siteData.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { useCollection } from "../hooks/useFirestore.js";

// Rotating logo loading screen
function SpinLoader({ message = "Loading Menu..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-captain-black text-white">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        className="w-16 h-16 border-4 border-captain-gold border-t-transparent rounded-full flex items-center justify-center"
      >
        <span className="font-bebas text-captain-gold text-2xl font-bold">C7</span>
      </motion.div>
      <p className="mt-4 font-nav text-xs font-extrabold uppercase tracking-[0.18em] text-white/60 animate-pulse">{message}</p>
    </div>
  );
}

// Skeleton card for loading state
function MenuCardSkeleton() {
  return (
    <div className="bg-captain-card border border-white/5 rounded-lg overflow-hidden animate-pulse">
      <div className="bg-white/5 aspect-[4/3]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-white/10 rounded w-1/4" />
          <div className="h-8 bg-white/10 rounded-full w-8" />
        </div>
      </div>
    </div>
  );
}

export default function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const tableNumParam = searchParams.get("table");
  const tableNum = Number(tableNumParam);

  const [tableValid, setTableValid] = useState(null); // null = loading, false = invalid, true = valid
  const [tableLabel, setTableLabel] = useState("");
  const [tableId, setTableId] = useState("");
  
  const [cart, setCart] = useState({}); // { itemId: { item, quantity, note } }
  const [cartOpen, setCartOpen] = useState(false);
  const [kitchenNote, setKitchenNote] = useState("");
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderId, setOrderId] = useState(""); // tracks active order for status screen
  const [activeOrder, setActiveOrder] = useState(null); // active order data
  
  const [toast, setToast] = useState("");
  const categoriesRef = useRef({});

  // Real-time Firestore hooks for items
  const { data: dbItems, loading: loadingItems } = useCollection("menuItems", [], { live: true });
  const menuItems = useMemo(() => {
    const items = dbItems.length ? dbItems : staticMenuItems;
    return items.filter(item => item.visible !== false && item.active !== false);
  }, [dbItems]);

  const categories = useMemo(() => ["All", ...staticCategories], []);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // 1. Validate Table on Load
  useEffect(() => {
    if (!tableNumParam || isNaN(tableNum)) {
      setTableValid(false);
      return;
    }

    const validateTable = async () => {
      try {
        const q = query(collection(db, "tables"), where("tableNumber", "==", tableNum));
        const snap = await getDocs(q);
        if (snap.empty) {
          setTableValid(false);
        } else {
          const tDoc = snap.docs[0];
          setTableId(tDoc.id);
          setTableLabel(tDoc.data().label || `Table ${tableNum}`);
          setTableValid(true);
        }
      } catch (err) {
        console.error("Table validation error:", err);
        setTableValid(false);
      }
    };
    validateTable();
  }, [tableNumParam, tableNum]);

  // 2. Real-time active order tracking lookup (if they already placed an order)
  useEffect(() => {
    if (!tableNum) return;
    
    // Listen for any active dine-in orders for this table
    const q = query(
      collection(db, "tableOrders"),
      where("tableNumber", "==", tableNum),
      where("status", "in", ["pending", "preparing", "ready", "served", "bill_requested"])
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        // Find the oldest active order
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setActiveOrder(docs[0]);
        setOrderId(docs[0].id);
      } else {
        setActiveOrder(null);
        setOrderId("");
      }
    });

    return unsub;
  }, [tableNum]);

  // 3. Category scroll spy
  const handleScrollToSection = (cat) => {
    setActiveCategory(cat);
    const element = document.getElementById(`cat-section-${cat}`);
    if (element) {
      const offset = 140; // sticky header + category bar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      const current = prev[item.id] || { item, quantity: 0, note: "" };
      return {
        ...prev,
        [item.id]: {
          ...current,
          quantity: current.quantity + 1
        }
      };
    });
  };

  const removeFromCart = (item) => {
    setCart((prev) => {
      const current = prev[item.id];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return {
        ...prev,
        [item.id]: {
          ...current,
          quantity: current.quantity - 1
        }
      };
    });
  };

  const updateItemNote = (itemId, note) => {
    setCart((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: {
          ...current,
          note
        }
      };
    });
  };

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartItemCount = useMemo(() => cartItems.reduce((acc, curr) => acc + curr.quantity, 0), [cartItems]);
  const cartSubtotal = useMemo(() => cartItems.reduce((acc, curr) => acc + curr.quantity * curr.item.price, 0), [cartItems]);
  const cartGst = useMemo(() => Math.round(cartSubtotal * 0.05), [cartSubtotal]);
  const cartTotal = useMemo(() => cartSubtotal + cartGst, [cartSubtotal, cartGst]);

  // Submit dine-in order
  const handlePlaceOrder = async () => {
    if (placingOrder || cartItemCount === 0) return;
    setPlacingOrder(true);

    try {
      // 1. Transaction to increment global counter and write order
      const counterRef = doc(db, "orderCounter", "global");
      
      const newOrderNum = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        let nextNum = 1;
        if (counterSnap.exists()) {
          nextNum = (counterSnap.data().totalOrders || 0) + 1;
          transaction.update(counterRef, { totalOrders: nextNum });
        } else {
          transaction.set(counterRef, { totalOrders: nextNum, lastResetAt: new Date() });
        }
        return nextNum;
      });

      // 2. Prepare payload
      const orderPayload = {
        orderNumber: newOrderNum,
        tableNumber: tableNum,
        tableId: tableId,
        items: cartItems.map((cartItem) => ({
          itemId: cartItem.item.id,
          name: cartItem.item.name,
          category: cartItem.item.category || "Uncategorized",
          price: Number(cartItem.item.price) || 0,
          quantity: Number(cartItem.quantity) || 1,
          isVeg: Boolean(cartItem.item.isVeg),
          specialNote: cartItem.note || ""
        })),
        subtotal: cartSubtotal,
        gst: cartGst,
        total: cartTotal,
        status: "pending",
        source: "dine-in",
        paymentStatus: "unpaid",
        paymentMethod: null,
        customerNote: kitchenNote || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        kitchenAcceptedAt: null,
        readyAt: null,
        completedAt: null,
        isExported: false
      };

      // 3. Save order document
      const docRef = await addDoc(collection(db, "tableOrders"), orderPayload);
      
      // 4. Update table status to occupied
      await addDoc(collection(db, "notifications"), {
        type: "new_table_order",
        title: "New Table Order",
        message: `${tableLabel} placed an order (#${newOrderNum}) for ₹${cartTotal}`,
        link: `/admin/orders`,
        isRead: false,
        createdAt: serverTimestamp()
      });

      // Clear cart
      setCart({});
      setKitchenNote("");
      setCartOpen(false);
      setOrderId(docRef.id);
      triggerToast("Order placed successfully!");
    } catch (err) {
      console.error("Place order failed:", err);
      triggerToast("Failed to place order. Try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleRequestBill = async () => {
    if (!orderId || !activeOrder) return;
    try {
      const orderRef = doc(db, "tableOrders", orderId);
      await runTransaction(db, async (transaction) => {
        transaction.update(orderRef, {
          status: "bill_requested",
          updatedAt: serverTimestamp()
        });
      });

      await addDoc(collection(db, "notifications"), {
        type: "bill_requested",
        title: "Bill Requested",
        message: `${tableLabel} requested their bill total: ₹${activeOrder.total}`,
        link: `/admin/orders`,
        isRead: false,
        createdAt: serverTimestamp()
      });

      triggerToast("Bill request sent!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to request bill");
    }
  };

  // Filter items by active tab
  const getSectionItems = (cat) => {
    if (cat === "All") return menuItems;
    return menuItems.filter(i => i.category === cat);
  };

  // Render Table Loading / Validation Checks
  if (tableValid === null) {
    return <SpinLoader message="Validating Table QR Code..." />;
  }

  if (tableValid === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-captain-black text-white px-6 text-center">
        <div className="w-20 h-20 bg-captain-gold/10 border border-captain-gold/30 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="text-captain-gold" size={36} />
        </div>
        <h1 className="font-bebas text-4xl text-white tracking-wide">Invalid QR Code</h1>
        <p className="mt-2 text-white/50 text-sm max-w-sm">This table configuration could not be loaded. Please scan the QR code printed on the table again.</p>
      </div>
    );
  }

  // Render Live Order Status Screen
  if (activeOrder) {
    const statuses = ["pending", "preparing", "ready", "served"];
    const statusIndex = statuses.indexOf(activeOrder.status);
    const orderNumberStr = String(activeOrder.orderNumber || 0).padStart(3, "0");

    return (
      <div className="min-h-screen bg-captain-black text-white p-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="font-bebas text-captain-gold text-2xl font-extrabold tracking-widest">C7</span>
            <span className="font-nav text-xs font-bold uppercase tracking-wider text-white/55">Eat & Play</span>
          </div>
          <span className="bg-captain-gold text-captain-black font-nav text-xs font-extrabold uppercase px-3 py-1 rounded-full">
            {tableLabel}
          </span>
        </div>

        {/* Tracking Card */}
        <div className="bg-captain-card border border-captain-gold/20 rounded-xl p-5 shadow-gold space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-captain-gold/15 border border-captain-gold/40 rounded-full flex items-center justify-center mx-auto mb-3">
              <ChefHat className="text-captain-bright animate-bounce" size={28} />
            </div>
            <h2 className="font-bebas text-3xl tracking-wide text-captain-bright">Order Placed!</h2>
            <div className="mt-1 font-mono text-white/45 text-xs">Order #{orderNumberStr}</div>
          </div>

          {/* Tracker bar */}
          <div className="relative flex justify-between items-center py-4">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-captain-gold -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(Math.max(0, statusIndex) / 3) * 100}%` }}
            />
            {statuses.map((st, idx) => {
              const isActive = idx === statusIndex;
              const isCompleted = idx < statusIndex;
              return (
                <div key={st} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      isActive
                        ? "border-captain-gold bg-captain-black shadow-gold scale-110"
                        : isCompleted
                        ? "border-captain-gold bg-captain-gold"
                        : "border-white/15 bg-captain-card"
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={14} className="text-captain-black stroke-[3px]" />
                    ) : (
                      <div className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-captain-gold animate-ping" : "bg-white/20"}`} />
                    )}
                  </div>
                  <span
                    className={`mt-2 font-nav text-[10px] font-extrabold uppercase tracking-wider ${
                      isActive ? "text-captain-gold" : isCompleted ? "text-white/60" : "text-white/30"
                    }`}
                  >
                    {st}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/5 pt-4 text-center">
            <p className="text-sm font-semibold text-white/80">
              {activeOrder.status === "pending" && "Waiting for kitchen confirmation... 🍳"}
              {activeOrder.status === "preparing" && "Chef is preparing your fresh meal... 👨‍🍳"}
              {activeOrder.status === "ready" && "Your food is ready & being served! 🍽️"}
              {activeOrder.status === "served" && "Food served! Enjoy your meal 🍔"}
              {activeOrder.status === "bill_requested" && "Bill requested! Waiter is on the way... 🔔"}
            </p>
          </div>
        </div>

        {/* Order Details List */}
        <div className="mt-8 space-y-4">
          <h3 className="font-bebas text-xl uppercase tracking-wider text-captain-gold border-b border-white/5 pb-2">Active Order Details</h3>
          <div className="space-y-3 bg-captain-card border border-white/5 rounded-xl p-4">
            {activeOrder.items?.map((it) => (
              <div key={it.itemId} className="flex justify-between items-center text-sm py-1">
                <div>
                  <span className="font-semibold text-white">{it.name}</span>
                  <span className="text-white/45 font-mono text-xs ml-2">x{it.quantity}</span>
                </div>
                <span className="font-mono text-white/80">{formatCurrency(it.price * it.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-white/5 pt-3 flex justify-between items-center font-bold text-sm">
              <span>Total Bill (Incl. GST)</span>
              <span className="text-captain-bright text-lg font-mono">{formatCurrency(activeOrder.total)}</span>
            </div>
          </div>
        </div>

        {/* Floating Actions */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-captain-black border-t border-white/5 flex gap-3">
          <button
            type="button"
            onClick={() => setActiveOrder(null)} // Local bypass to view menu
            className="flex-1 bg-captain-card border border-white/10 hover:border-captain-gold py-3.5 rounded-lg text-xs font-extrabold font-nav uppercase tracking-wider text-white transition flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add More Items
          </button>
          
          {(activeOrder.status === "served" || activeOrder.status === "bill_requested") && (
            <button
              type="button"
              disabled={activeOrder.status === "bill_requested"}
              onClick={handleRequestBill}
              className="flex-1 bg-captain-gold hover:bg-captain-gold/90 disabled:bg-captain-gold/40 py-3.5 rounded-lg text-xs font-extrabold font-nav uppercase tracking-wider text-captain-black transition flex items-center justify-center gap-2"
            >
              <ShoppingCart className="shrink-0" size={16} />
              {activeOrder.status === "bill_requested" ? "Requested..." : "Request Bill"}
            </button>
          )}
        </div>
        <Toast message={toast} />
      </div>
    );
  }

  // Render Active Food Menu Selection
  return (
    <div className="min-h-screen bg-captain-black text-white pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-captain-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bebas text-captain-gold text-2xl font-extrabold tracking-widest">C7</span>
          <span className="font-nav text-xs font-bold uppercase tracking-wider text-white/55">Table Order</span>
        </div>
        <div className="bg-captain-gold text-captain-black font-nav text-xs font-extrabold uppercase px-3.5 py-1.5 rounded-full flex items-center justify-center">
          {tableLabel}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => cartItemCount > 0 && setCartOpen(true)}
            className="p-2 border border-white/10 rounded-full hover:border-captain-gold"
            aria-label="View Cart"
          >
            <ShoppingBag size={18} />
          </button>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-captain-gold text-captain-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </div>
      </header>

      {/* Categories Sticky Bar */}
      <div className="sticky top-[58px] z-40 bg-captain-black/95 border-b border-white/5 py-2.5 px-4 overflow-x-auto select-none">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleScrollToSection(cat)}
              className={`rounded-full px-4 py-2 font-nav text-[10px] font-extrabold uppercase tracking-wider shrink-0 transition ${
                activeCategory === cat ? "bg-captain-gold text-captain-black" : "bg-captain-charcoal text-white/60 border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards */}
      <div className="p-4 space-y-8 mt-4">
        {loadingItems ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[1, 2, 4, 5].map((idx) => (
              <MenuCardSkeleton key={idx} />
            ))}
          </div>
        ) : (
          categories.map((cat) => {
            const catItems = getSectionItems(cat);
            if (!catItems.length || cat === "All") return null;

            return (
              <div key={cat} id={`cat-section-${cat}`} className="space-y-4">
                <h2 className="font-bebas text-2xl uppercase tracking-wider text-captain-gold border-b border-white/5 pb-2">
                  {cat}
                </h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {catItems.map((item) => {
                    const cartItem = cart[item.id];
                    return (
                      <div key={item.id} className="bg-captain-card border border-white/5 rounded-lg overflow-hidden flex flex-col justify-between">
                        <div className="relative">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-full aspect-[4/3] object-cover" />
                          )}
                          {/* Veg/Non-veg dot */}
                          <span className="absolute top-2.5 left-2.5 flex h-4 w-4 items-center justify-center bg-black/50 rounded p-0.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                          </span>
                          {item.isBestseller && (
                            <span className="absolute top-2 right-2 bg-captain-gold text-captain-black text-[9px] font-extrabold uppercase px-2 py-0.5 rounded shadow">
                              Bestseller
                            </span>
                          )}
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-semibold text-sm text-white line-clamp-1">{item.name}</h3>
                            <p className="text-white/45 text-[11px] leading-relaxed mt-1 line-clamp-2">{item.description}</p>
                          </div>

                          <div className="mt-4 flex justify-between items-center">
                            <span className="font-mono text-captain-gold text-sm font-bold">{formatCurrency(item.price)}</span>
                            {cartItem ? (
                              <div className="flex items-center gap-2 bg-captain-charcoal border border-captain-gold/30 rounded-full px-2 py-1">
                                <button type="button" onClick={() => removeFromCart(item)} className="p-1 hover:text-captain-gold text-white/80">
                                  <Minus size={12} />
                                </button>
                                <span className="text-xs font-bold text-white font-mono w-4 text-center">{cartItem.quantity}</span>
                                <button type="button" onClick={() => addToCart(item)} className="p-1 hover:text-captain-gold text-white/80">
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                className="bg-captain-gold text-captain-black p-1.5 rounded-full hover:bg-captain-gold/90 transition shadow-lg"
                                aria-label={`Add ${item.name} to cart`}
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Optional Card Note */}
                        {cartItem && (
                          <div className="px-3 pb-3 border-t border-white/5 pt-2">
                            <input
                              type="text"
                              value={cartItem.note}
                              onChange={(e) => updateItemNote(item.id, e.target.value)}
                              placeholder="Spicy note (e.g. less spice)"
                              className="w-full bg-captain-black border border-white/5 rounded px-2 py-1 text-[10px] text-white/60 focus:border-captain-gold outline-none"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Bottom Cart Bar */}
      <AnimatePresence>
        {cartItemCount > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 inset-x-0 p-4 bg-captain-black border-t border-captain-gold/30 z-30 flex items-center justify-between"
          >
            <div>
              <div className="text-white/55 text-[11px] font-nav uppercase tracking-wider font-extrabold">{cartItemCount} items in cart</div>
              <div className="font-mono text-captain-bright text-lg font-bold">{formatCurrency(cartTotal)}</div>
            </div>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="bg-captain-gold text-captain-black font-nav text-xs font-extrabold uppercase tracking-wider px-5 py-3 rounded-lg hover:bg-captain-gold/90 transition flex items-center gap-1"
            >
              View Order <ChevronRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            {/* Slide up Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 max-h-[90vh] bg-captain-charcoal border-t border-captain-gold/30 rounded-t-2xl z-50 flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-bebas text-2xl tracking-wide uppercase text-captain-gold">Your Order</h3>
                  <p className="text-white/45 text-xs font-mono">{tableLabel}</p>
                </div>
                <button type="button" onClick={() => setCartOpen(false)} className="text-white/45 hover:text-white font-semibold text-sm">
                  Close
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-4 max-h-[40vh]">
                {cartItems.map(({ item, quantity, note }) => (
                  <div key={item.id} className="flex justify-between items-start border-b border-white/5 pb-3">
                    <div className="space-y-1 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-sm font-semibold text-white">{item.name}</span>
                      </div>
                      {note && <p className="text-xs text-captain-gold font-medium">Note: "{note}"</p>}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2 bg-captain-black border border-white/10 rounded-full px-2 py-0.5">
                        <button type="button" onClick={() => removeFromCart(item)} className="p-1 hover:text-captain-gold">
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-bold text-white font-mono w-4 text-center">{quantity}</span>
                        <button type="button" onClick={() => addToCart(item)} className="p-1 hover:text-captain-gold">
                          <Plus size={10} />
                        </button>
                      </div>
                      <span className="font-mono text-sm text-white/80 w-16 text-right">
                        {formatCurrency(item.price * quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="p-5 bg-captain-black/40 border-t border-white/5 space-y-4">
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5% on Food)</span>
                    <span className="font-mono">{formatCurrency(cartGst)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-white/5 pt-2">
                    <span>Total Amount</span>
                    <span className="text-captain-bright text-base font-mono">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-nav font-extrabold uppercase tracking-wider text-white/45">Special Instructions for Kitchen</label>
                  <textarea
                    rows={2}
                    value={kitchenNote}
                    onChange={(e) => setKitchenNote(e.target.value)}
                    placeholder="E.g., No onion/garlic, serve drinks first..."
                    className="w-full bg-captain-black border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-white/20 focus:border-captain-gold outline-none resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full bg-captain-gold hover:bg-captain-gold/90 py-3.5 rounded-lg text-sm font-extrabold font-nav uppercase tracking-wider text-captain-black transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {placingOrder ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toast message={toast} />
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[80] bg-captain-card border border-captain-gold/30 rounded-full px-5 py-2.5 text-xs font-bold font-nav text-captain-bright shadow-gold animate-fadeIn">
      {message}
    </div>
  );
}
