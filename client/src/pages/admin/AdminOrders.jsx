import { useMemo, useState, useEffect, useRef } from "react";
import { ExternalLink, MapPin, ReceiptText, FileText, CheckCircle, HelpCircle, XCircle, Printer, MessageSquare, AlertTriangle, Clock, Volume2, Trash2 } from "lucide-react";
import { addDoc, collection, doc, serverTimestamp, updateDoc, deleteDoc, onSnapshot, getDocs, writeBatch, query, orderBy } from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { db } from "../../firebase.js";
import { useCollection, useDocument } from "../../hooks/useFirestore.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { googleMapsSearchUrl } from "../../utils/maps.js";

// Live Timer hook for Kanban cards elapsed time
function useTimeElapsed(createdAt) {
  const [elapsedText, setElapsedText] = useState("");
  const [colorCode, setColorCode] = useState("text-green-400"); // green, yellow, red

  useEffect(() => {
    if (!createdAt) return;
    const calculate = () => {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 8) {
        setElapsedText(`${diffMins} min ago`);
        setColorCode("text-green-400 font-semibold");
      } else if (diffMins < 15) {
        setElapsedText(`${diffMins} min ago`);
        setColorCode("text-yellow-400 font-bold");
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

function TimeAgoTag({ createdAt }) {
  const { elapsedText, colorCode } = useTimeElapsed(createdAt);
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${colorCode}`}>
      <Clock size={11} /> {elapsedText || "Just now"}
    </span>
  );
}

// 100-Order Export & Auto-Clear Popup Component
function ExportThresholdPopup({ totalOrders, threshold, lastResetAt }) {
  const [exporting, setExporting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const expiry = localStorage.getItem("captain7:exportAlertDismissedUntil");
    if (expiry && Number(expiry) > Date.now()) {
      setDismissed(true);
    } else {
      setDismissed(false);
    }
  }, [totalOrders]);

  if (totalOrders < threshold || dismissed) return null;

  const handleExportAndClear = async () => {
    setExporting(true);
    try {
      // Fetch both delivery and table orders
      const snapDelivery = await getDocs(collection(db, "orders"));
      const snapTable = await getDocs(collection(db, "tableOrders"));

      const deliveryList = snapDelivery.docs.map(d => ({ id: d.id, type: "Delivery", ...d.data() }));
      const tableList = snapTable.docs.map(d => ({ id: d.id, type: "Dine-In", ...d.data() }));
      const allOrders = [...deliveryList, ...tableList];

      allOrders.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

      if (allOrders.length === 0) {
        alert("No orders found to export.");
        setExporting(false);
        return;
      }

      // Generate PDF
      const docPdf = new jsPDF();
      
      // Page 1 Cover
      docPdf.setFillColor(10, 10, 10);
      docPdf.rect(0, 0, 210, 297, "F");
      docPdf.setTextColor(201, 168, 76);
      docPdf.setFontSize(28);
      docPdf.text("CAPTAIN 7 EAT & PLAY", 105, 100, { align: "center" });
      docPdf.setTextColor(250, 250, 250);
      docPdf.setFontSize(16);
      docPdf.text("Order Export & Cleanup Report", 105, 115, { align: "center" });
      
      docPdf.setFontSize(10);
      docPdf.setTextColor(150, 150, 150);
      const dateStr = new Date().toLocaleString();
      docPdf.text(`Export Date: ${dateStr}`, 105, 180, { align: "center" });
      docPdf.text(`Total Orders Cleared: ${allOrders.length}`, 105, 190, { align: "center" });
      const revSum = allOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      docPdf.text(`Total Revenue Cleared: ${formatCurrency(revSum)}`, 105, 200, { align: "center" });
      
      docPdf.text("Captain 7 Eat & Play | FSSAI: 10123022000035 | Narasaraopet", 105, 280, { align: "center" });

      // Page 2 Orders Table
      docPdf.addPage();
      docPdf.setFontSize(14);
      docPdf.setTextColor(201, 168, 76);
      docPdf.text("ORDERS SUMMARY LOG", 14, 20);

      const tableRows = allOrders.map((o) => [
        o.orderNumber ? `#${String(o.orderNumber).padStart(3, "0")}` : `#${o.id.slice(-5)}`,
        o.type === "Dine-In" ? `Table ${o.tableNumber}` : "Delivery",
        o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : "Just now",
        o.items?.map(it => `${it.name} x${it.quantity}`).join(", ") || "",
        formatCurrency(o.subtotal || 0),
        formatCurrency(o.gst || 0),
        formatCurrency(o.total || 0),
        (o.status || "").toUpperCase(),
        (o.paymentMethod || "Pending").toUpperCase()
      ]);

      docPdf.autoTable({
        startY: 28,
        head: [["Order#", "Type", "Date & Time", "Items", "Subtotal", "GST", "Total", "Status", "Payment"]],
        body: tableRows,
        theme: "dark",
        headStyles: { fillColor: [201, 168, 76], textColor: [10, 10, 10] },
        alternateRowStyles: { fillColor: [22, 22, 22] }
      });

      const filename = `Captain7_Orders_${new Date().toISOString().slice(0, 10)}.pdf`;
      docPdf.save(filename);

      // Batch Delete
      const batch = writeBatch(db);
      snapDelivery.docs.forEach(d => batch.delete(d.ref));
      snapTable.docs.forEach(d => batch.delete(d.ref));

      // Reset counter
      const counterRef = doc(db, "orderCounter", "global");
      batch.update(counterRef, {
        totalOrders: 0,
        lastResetAt: serverTimestamp()
      });

      // Clear table occupancy
      const tablesSnap = await getDocs(collection(db, "tables"));
      tablesSnap.docs.forEach(tDoc => {
        batch.update(tDoc.ref, { isOccupied: false, currentOrderId: null });
      });

      await batch.commit();
      alert("PDF exported and order history cleared successfully!");
      setDismissed(true);
    } catch (err) {
      console.error(err);
      alert("Failed to export: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleRemindLater = () => {
    const future = Date.now() + 30 * 60 * 1000;
    localStorage.setItem("captain7:exportAlertDismissedUntil", String(future));
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-4">
      <div className="bg-captain-card border-2 border-captain-gold/40 rounded-xl p-8 max-w-lg w-full text-center space-y-6 shadow-gold-strong">
        <div className="w-20 h-20 bg-captain-gold/10 border border-captain-gold/30 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
          <AlertTriangle className="text-captain-bright" size={40} />
        </div>
        
        <div>
          <h2 className="font-bebas text-captain-gold text-4xl tracking-widest font-extrabold">100 ORDERS THRESHOLD REACHED</h2>
          <p className="text-white/60 text-xs mt-2 leading-relaxed">
            The system has reached the configured threshold of <span className="text-white font-bold">{threshold} orders</span>. Please export data and clear records to maintain peak performance.
          </p>
        </div>

        <div className="text-left bg-captain-black/40 border border-white/5 p-4 rounded-lg space-y-2 text-xs text-white/70">
          <div className="flex justify-between">
            <span>Current orders count:</span>
            <span className="font-bold text-captain-bright">{totalOrders}</span>
          </div>
          <div className="flex justify-between">
            <span>Action details:</span>
            <span className="text-green-400 font-semibold">Generate PDF summary & clear records</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            disabled={exporting}
            onClick={handleExportAndClear}
            className="w-full bg-captain-gold hover:bg-captain-gold/90 py-3.5 rounded-lg text-xs font-extrabold font-nav uppercase tracking-wider text-captain-black transition disabled:opacity-50"
          >
            {exporting ? "Generating PDF & Clearing Data..." : "Export & Clear Now"}
          </button>
          
          <button
            type="button"
            onClick={handleRemindLater}
            className="text-white/45 hover:text-white text-xs font-semibold hover:underline"
          >
            Remind Me in 30 Minutes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [toast, setToast] = useState("");
  const [assigningId, setAssigningId] = useState("");
  const [activeTab, setActiveTab] = useState("delivery"); // delivery, dinein
  const [viewMode, setViewMode] = useState("kanban"); // kanban, list (for dinein)
  
  // Audio Autoplay unlock state
  const soundEnabledRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Modals / Details
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { order, collectionName }
  
  // Real-time state collections
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [loadingDelivery, setLoadingDelivery] = useState(true);

  const [dineinOrders, setDineinOrders] = useState([]);
  const [loadingDineIn, setLoadingDineIn] = useState(true);

  const { data: users, loading: loadingUsers } = useCollection("users", [], { live: true });
  const { data: tables } = useCollection("tables", [], { live: true });
  const { data: globalCounter } = useDocument("orderCounter/global", { totalOrders: 0 });
  const { data: orderingConfig } = useDocument("settings/tableOrderingConfig", { exportThreshold: 100 });

  const workers = useMemo(() => users.filter((user) => user.role === "worker"), [users]);

  const isFirstDeliveryLoad = useRef(true);
  const isFirstDineInLoad = useRef(true);

  function triggerToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }

  // Audio play helper
  const playSound = (path) => {
    if (!soundEnabledRef.current) return;
    try {
      const audio = new Audio(path);
      audio.play().catch((err) => console.log("Audio play error:", err));
    } catch (err) {
      console.log(err);
    }
  };

  // Unlock browser audio autoplay on first click/tap anywhere on page
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

  // 1. Real-time Listener for Delivery Orders (`orders` collection) -> /1.mp4
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDeliveryOrders(docs);
      setLoadingDelivery(false);

      if (!isFirstDeliveryLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            playSound("/1.mp4");
            triggerToast(`🛵 New Delivery Order! #${change.doc.id}`);
          }
        });
      }
      isFirstDeliveryLoad.current = false;
    });

    return unsubscribe;
  }, []);

  // 2. Real-time Listener for Dine-In Table Orders (`tableOrders` collection) -> /2.mp4
  useEffect(() => {
    const q = query(collection(db, "tableOrders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((o) => o.status !== "completed" && o.status !== "cancelled");
      setDineinOrders(docs);
      setLoadingDineIn(false);

      if (!isFirstDineInLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            playSound("/2.mp4");
            const data = change.doc.data();
            triggerToast(`🍽️ New Table Order! Table ${data.tableNumber || "N/A"}`);
          }
        });
      }
      isFirstDineInLoad.current = false;
    });

    return unsubscribe;
  }, []);

  // Delivery assigns
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

  // Delete Order Handler
  const handleDeleteOrder = async (target) => {
    if (!target) return;
    const { order, collectionName } = target;
    try {
      await deleteDoc(doc(db, collectionName, order.id));
      if (order.tableNumber) {
        const matchingTable = tables.find(t => t.tableNumber === order.tableNumber);
        if (matchingTable) {
          await updateDoc(doc(db, "tables", matchingTable.id), {
            isOccupied: false,
            currentOrderId: null
          });
        }
      }
      triggerToast("Order deleted successfully!");
      setDeleteTarget(null);
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
      triggerToast("Failed to delete order: " + err.message);
    }
  };

  // Dine-in order progression actions in `tableOrders` collection
  const handleUpdateDineInStatus = async (orderId, newStatus) => {
    try {
      const updates = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      
      if (newStatus === "completed") {
        updates.paymentStatus = "paid";
        updates.completedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "tableOrders", orderId), updates);
      
      // If completed, clear table status
      if (newStatus === "completed" && selectedOrder?.tableNumber) {
        const tableNum = selectedOrder.tableNumber;
        const matchingTable = tables.find(t => t.tableNumber === tableNum);
        if (matchingTable) {
          await updateDoc(doc(db, "tables", matchingTable.id), {
            isOccupied: false,
            currentOrderId: null
          });
        }
      }

      triggerToast(`Order updated to ${newStatus}`);
      setSelectedOrder(null);
    } catch (err) {
      triggerToast(err.message || "Failed to update status");
    }
  };

  const handleUpdatePayment = async (orderId, method) => {
    try {
      await updateDoc(doc(db, "tableOrders", orderId), {
        paymentStatus: "paid",
        paymentMethod: method,
        status: "completed",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (selectedOrder?.tableNumber) {
        const tableNum = selectedOrder.tableNumber;
        const matchingTable = tables.find(t => t.tableNumber === tableNum);
        if (matchingTable) {
          await updateDoc(doc(db, "tables", matchingTable.id), {
            isOccupied: false,
            currentOrderId: null
          });
        }
      }

      triggerToast("Payment recorded & order completed!");
      setSelectedOrder(null);
    } catch (err) {
      triggerToast(err.message || "Failed to update payment");
    }
  };

  // Generate Thermal Receipt plain text for WhatsApp
  const generateWhatsAppText = (order) => {
    const orderNum = String(order.orderNumber || 0).padStart(3, "0");
    const dateStr = order.createdAt?.seconds 
      ? new Date(order.createdAt.seconds * 1000).toLocaleString() 
      : new Date().toLocaleString();
    
    let text = `*CAPTAIN 7 EAT & PLAY*\n`;
    text += `107, Bypass Road, Narasaraopet\n`;
    text += `Ph: +91 90004 69552\n`;
    text += `--------------------------------------\n`;
    text += `*Order #:* ${orderNum}  |  *Table:* ${order.tableNumber}\n`;
    text += `*Date:* ${dateStr}\n`;
    text += `--------------------------------------\n`;
    order.items?.forEach((it) => {
      text += `${it.name} x${it.quantity} - ₹${it.price * it.quantity}\n`;
    });
    text += `--------------------------------------\n`;
    text += `Subtotal: ₹${order.subtotal}\n`;
    text += `GST (5%): ₹${order.gst}\n`;
    text += `*TOTAL BILL:* ₹${order.total}\n`;
    text += `--------------------------------------\n`;
    text += `Payment: ${order.paymentMethod || "Pending"}\n`;
    text += `Thank you for dining with us! Visit Again.`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 relative">
      {/* 100-Order Export Alert */}
      <ExportThresholdPopup
        totalOrders={globalCounter.totalOrders}
        threshold={orderingConfig.exportThreshold || 100}
        lastResetAt={globalCounter.lastResetAt}
      />

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
            <span>🔊 Click anywhere on this page to enable sound notifications!</span>
          </div>
          <span className="bg-captain-gold text-captain-black px-2.5 py-1 rounded text-[10px]">Enable Sound</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="font-display text-5xl text-white">ORDER CENTER</h1>
          <p className="mt-2 text-sm text-white/55">Real-time online delivery (`orders`) and dine-in QR table (`tableOrders`) manager.</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-captain-card border border-white/5 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("delivery")}
            className={`rounded-md px-4 py-2 font-nav text-xs font-extrabold uppercase tracking-wider transition ${
              activeTab === "delivery" ? "bg-captain-gold text-captain-black" : "text-white/60"
            }`}
          >
            Delivery Orders ({deliveryOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dinein")}
            className={`rounded-md px-4 py-2 font-nav text-xs font-extrabold uppercase tracking-wider transition ${
              activeTab === "dinein" ? "bg-captain-gold text-captain-black" : "text-white/60"
            }`}
          >
            Dine-In Table Orders ({dineinOrders.length})
          </button>
        </div>
      </div>

      {/* ==================== 1. DELIVERY TAB ==================== */}
      {activeTab === "delivery" && (
        <Card hover={false} className="p-0 no-print">
          {loadingDelivery || loadingUsers ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : deliveryOrders.length === 0 ? (
            <div className="grid min-h-[260px] place-items-center text-center text-white/45">No delivery orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/42">
                    <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Address</th>
                    <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Assigned Worker</th>
                    <th className="px-4 py-3 text-right font-nav text-[11px] font-extrabold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryOrders.map((order) => {
                    const address = order.fullAddress || order.customerAddress || "";
                    const itemsText = order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ") || "";
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
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[220px] px-4 py-4 text-xs leading-6">{itemsText}</td>
                        <td className="px-4 py-4 font-mono font-bold text-white">{formatCurrency(order.total || 0)}</td>
                        <td className="px-4 py-4">
                          <Badge tone={order.status === "delivered" ? "green" : "blue"}>{order.status}</Badge>
                        </td>
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
                              <button
                                type="button"
                                onClick={() => setReceiptOrder(order)}
                                className="inline-flex items-center gap-2 rounded-full border border-captain-gold/45 px-3 py-2 text-xs text-captain-bright"
                              >
                                <ReceiptText size={14} /> View Receipt
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ order, collectionName: "orders" })}
                              className="p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white transition"
                              title="Delete Order"
                            >
                              <Trash2 size={14} />
                            </button>
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
      )}

      {/* ==================== 2. DINE-IN TAB ==================== */}
      {activeTab === "dinein" && (
        <div className="space-y-6 no-print">
          {/* Controls switcher */}
          <div className="flex justify-between items-center">
            <h3 className="font-bebas text-captain-gold text-2xl tracking-wider">Dine-in Tables Order Board (`tableOrders`)</h3>
            <div className="flex bg-captain-card border border-white/5 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`rounded px-3 py-1.5 font-nav font-extrabold uppercase transition ${
                  viewMode === "kanban" ? "bg-captain-gold text-captain-black" : "text-white/60"
                }`}
              >
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded px-3 py-1.5 font-nav font-extrabold uppercase transition ${
                  viewMode === "list" ? "bg-captain-gold text-captain-black" : "text-white/60"
                }`}
              >
                List View
              </button>
            </div>
          </div>

          {/* Kanban Board View */}
          {viewMode === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {["pending", "preparing", "ready", "bill_requested"].map((colStatus) => {
                const columnOrders = dineinOrders.filter(o => o.status === colStatus);
                return (
                  <div key={colStatus} className="bg-captain-charcoal border border-white/5 rounded-xl p-4 flex flex-col space-y-4 min-h-[480px]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="font-bebas text-lg tracking-wider text-captain-bright uppercase">
                        {colStatus.replace("_", " ")}
                      </span>
                      <span className="font-mono text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                        {columnOrders.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3">
                      {columnOrders.map((order) => (
                        <div
                          key={order.id}
                          className={`bg-captain-card border p-3 rounded-lg hover:border-captain-gold cursor-pointer transition relative group ${
                            order.status === "bill_requested" ? "border-red-500/35 bg-red-950/10 shadow-lg animate-pulse" : "border-white/5"
                          }`}
                        >
                          {order.status === "bill_requested" && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-nav text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full animate-bounce">
                              Bill
                            </span>
                          )}
                          <div className="flex justify-between items-center">
                            <span onClick={() => setSelectedOrder(order)} className="font-bebas text-white text-lg tracking-wider hover:text-captain-bright">
                              TABLE {order.tableNumber}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-white/45 text-[10px]">
                                #{order.orderNumber ? String(order.orderNumber).padStart(3, "0") : String(order.id).slice(-4)}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget({ order, collectionName: "tableOrders" });
                                }}
                                className="p-1 rounded bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white transition"
                                title="Delete Order"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          
                          <div onClick={() => setSelectedOrder(order)} className="mt-1">
                            <TimeAgoTag createdAt={order.createdAt} />
                          </div>

                          <p onClick={() => setSelectedOrder(order)} className="text-[11px] text-white/50 line-clamp-2 mt-2 leading-relaxed">
                            {order.items?.map(it => `${it.quantity}× ${it.name}`).join(", ")}
                          </p>

                          <div onClick={() => setSelectedOrder(order)} className="mt-4 flex justify-between items-center border-t border-white/5 pt-2">
                            <span className="font-mono text-captain-gold text-xs font-bold">{formatCurrency(order.total)}</span>
                            <span className="text-[10px] text-white/30 font-nav uppercase tracking-wider">View Details ➔</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <Card hover={false} className="p-0">
              {dineinOrders.length === 0 ? (
                <div className="grid min-h-[260px] place-items-center text-center text-white/45">No active table orders.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/42">
                        <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Order#</th>
                        <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Table</th>
                        <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Items</th>
                        <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 font-nav text-[11px] font-extrabold uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right font-nav text-[11px] font-extrabold uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dineinOrders.map((order) => (
                        <tr key={order.id} className="border-b border-white/7 align-top text-white/68">
                          <td className="px-4 py-4 font-mono font-bold text-captain-bright">
                            #{order.orderNumber ? String(order.orderNumber).padStart(3, "0") : String(order.id).slice(-4)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-white">Table {order.tableNumber}</td>
                          <td className="px-4 py-4 text-xs leading-5">
                            {order.items?.map(it => `${it.quantity}× ${it.name}`).join(", ")}
                          </td>
                          <td className="px-4 py-4 font-mono font-bold text-white">{formatCurrency(order.total || 0)}</td>
                          <td className="px-4 py-4">
                            <Badge tone={order.status === "bill_requested" ? "red" : "blue"}>
                              {order.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="inline-flex items-center gap-2 rounded-full border border-captain-gold/45 px-3 py-1.5 text-xs text-captain-bright"
                              >
                                View Order
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ order, collectionName: "tableOrders" })}
                                className="p-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white transition"
                                title="Delete Order"
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
          )}

          {/* Real-time Table grid occupancy overview */}
          <div className="space-y-4">
            <h3 className="font-bebas text-captain-gold text-2xl tracking-wider">Tables Real-Time Layout</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {tables.map((table) => {
                const tableActiveOrder = dineinOrders.find(o => o.tableNumber === table.tableNumber);
                return (
                  <div
                    key={table.id}
                    className={`border p-4 rounded-xl text-center space-y-2 flex flex-col justify-between transition ${
                      table.isOccupied
                        ? "border-red-500/20 bg-red-950/5 shadow-lg"
                        : "border-white/5 bg-captain-card"
                    }`}
                  >
                    <div>
                      <div className="font-bebas text-white text-xl tracking-wide">{table.label}</div>
                      <div className="text-[10px] uppercase font-nav font-bold tracking-wider mt-1">
                        {table.isOccupied ? (
                          <span className="text-red-400">Occupied</span>
                        ) : (
                          <span className="text-green-400">Available</span>
                        )}
                      </div>
                    </div>

                    {tableActiveOrder && (
                      <div className="border-t border-white/5 pt-2 text-[10px] font-mono text-captain-bright">
                        Total: {formatCurrency(tableActiveOrder.total)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Dine-in order detail modal */}
      <Modal open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} title="Order Detail">
        {selectedOrder ? (
          <div className="space-y-6 text-sm text-white/70">
            {/* Order header information */}
            <div className="bg-captain-black border border-white/10 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="font-bebas text-captain-bright text-3xl font-bold tracking-wider">TABLE {selectedOrder.tableNumber}</span>
                <div className="font-mono text-xs text-white/40 mt-0.5">
                  Order #{selectedOrder.orderNumber ? String(selectedOrder.orderNumber).padStart(3, "0") : String(selectedOrder.id).slice(-4)}
                </div>
              </div>
              <Badge tone={selectedOrder.status === "bill_requested" ? "red" : "blue"}>
                {selectedOrder.status.replace("_", " ")}
              </Badge>
            </div>

            {/* List items ordered */}
            <div>
              <div className="mb-2 font-nav text-xs font-extrabold uppercase tracking-wider text-captain-gold">Ordered Items</div>
              <div className="space-y-3 bg-captain-black/30 border border-white/5 p-4 rounded-xl">
                {selectedOrder.items?.map((it, i) => (
                  <div key={`${it.itemId || i}`} className="flex justify-between items-baseline border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                    <div className="pr-4">
                      <div className="font-semibold text-white">{it.name}</div>
                      {it.specialNote && <p className="text-xs text-captain-gold italic">"{it.specialNote}"</p>}
                    </div>
                    <span className="font-mono text-white shrink-0">
                      ₹{it.price} × {it.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal, GST, Total pricing details */}
            <div className="grid gap-2 bg-captain-black/50 border border-white/10 p-4 rounded-xl font-mono">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>{formatCurrency(selectedOrder.gst || 0)}</span>
              </div>
              <div className="flex justify-between text-captain-bright text-lg font-bold border-t border-white/5 pt-2">
                <span>Total Bill</span>
                <span>{formatCurrency(selectedOrder.total || 0)}</span>
              </div>
            </div>

            {/* Timeline controls / Action buttons */}
            <div className="border-t border-white/5 pt-4 space-y-4">
              <div className="font-nav text-xs font-extrabold uppercase tracking-wider text-captain-gold">Status Progression</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedOrder.status === "pending" && (
                  <Button onClick={() => handleUpdateDineInStatus(selectedOrder.id, "preparing")} className="w-full">
                    Accept Order
                  </Button>
                )}
                {selectedOrder.status === "preparing" && (
                  <Button onClick={() => handleUpdateDineInStatus(selectedOrder.id, "ready")} className="w-full">
                    Mark Ready
                  </Button>
                )}
                {selectedOrder.status === "ready" && (
                  <Button onClick={() => handleUpdateDineInStatus(selectedOrder.id, "served")} className="w-full">
                    Mark Served
                  </Button>
                )}
                {selectedOrder.status === "served" && (
                  <Button onClick={() => handleUpdateDineInStatus(selectedOrder.id, "bill_requested")} className="w-full">
                    Dine-in Served
                  </Button>
                )}
              </div>

              {/* Payment Settlement controls */}
              {(selectedOrder.status === "bill_requested" || selectedOrder.status === "served") && (
                <div className="bg-captain-gold/5 border border-captain-gold/25 p-4 rounded-xl space-y-4">
                  <div className="font-nav text-xs font-extrabold uppercase tracking-wider text-captain-bright">Settle Payment & Clear Table</div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button onClick={() => handleUpdatePayment(selectedOrder.id, "cash")} variant="secondary" className="text-xs">
                      Paid via Cash
                    </Button>
                    <Button onClick={() => handleUpdatePayment(selectedOrder.id, "upi")} variant="secondary" className="text-xs">
                      Paid via UPI
                    </Button>
                    <Button onClick={() => handleUpdatePayment(selectedOrder.id, "card")} variant="secondary" className="text-xs">
                      Paid via Card
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Printable Thermal receipt / WhatsApp Share / Delete Button */}
            <div className="border-t border-white/5 pt-4 grid grid-cols-3 gap-3">
              <Button onClick={() => generateWhatsAppText(selectedOrder)} className="flex items-center justify-center gap-1.5 text-xs">
                <MessageSquare size={14} /> WhatsApp
              </Button>
              <Button onClick={() => setReceiptOrder(selectedOrder)} variant="secondary" className="flex items-center justify-center gap-1.5 text-xs">
                <Printer size={14} /> Receipt
              </Button>
              <button
                type="button"
                onClick={() => setDeleteTarget({ order: selectedOrder, collectionName: "tableOrders" })}
                className="bg-red-950/40 border border-red-500/30 hover:bg-red-600 text-red-400 hover:text-white rounded-lg font-nav text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delivery Receipt / Thermal Print Receipt Modal wrapper */}
      <Modal open={Boolean(receiptOrder)} onClose={() => setReceiptOrder(null)} title="Receipt Preview">
        {receiptOrder ? (
          <div className="space-y-6">
            {/* The printable receipt block */}
            <div id="receipt-print-area" className="bg-white text-black p-6 font-mono max-w-sm mx-auto text-xs border border-black/10 rounded space-y-4">
              <div className="text-center space-y-1">
                <h2 className="font-bold text-base tracking-widest uppercase">CAPTAIN 7 EAT & PLAY</h2>
                <p>107, Bypass Road, Narasaraopet</p>
                <p>Ph: +91 90004 69552</p>
              </div>
              <div className="border-y border-dashed border-black py-2.5 space-y-1 flex justify-between">
                <div>
                  <div>Order #: {receiptOrder.orderNumber ? String(receiptOrder.orderNumber).padStart(3, "0") : String(receiptOrder.id).slice(-4)}</div>
                  <div>Date: {receiptOrder.createdAt?.seconds ? new Date(receiptOrder.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div>Table: {receiptOrder.tableNumber || "Delivery"}</div>
                  <div>Time: {receiptOrder.createdAt?.seconds ? new Date(receiptOrder.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString()}</div>
                </div>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black">
                    <th className="py-1">ITEM</th>
                    <th className="py-1 text-center">QTY</th>
                    <th className="py-1 text-right">PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptOrder.items?.map((it, idx) => (
                    <tr key={`${it.itemId || idx}`}>
                      <td className="py-1">{it.name}</td>
                      <td className="py-1 text-center">{it.quantity}</td>
                      <td className="py-1 text-right">₹{it.price * it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-black pt-2 space-y-1.5 font-bold">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(receiptOrder.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span>{formatCurrency(receiptOrder.gst || 0)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-black pt-1.5">
                  <span>TOTAL BILL</span>
                  <span>{formatCurrency(receiptOrder.total || 0)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-black pt-2.5 text-center text-[10px] space-y-1">
                <div>Payment Method: {(receiptOrder.paymentMethod || "UPI/Cash").toUpperCase()}</div>
                <div>FSSAI: 10123022000035</div>
                <div className="font-bold pt-1.5">Thank you for dining with us!</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 no-print">
              <Button onClick={() => window.print()} className="flex items-center gap-2">
                <Printer size={16} /> Print Bill
              </Button>
              <Button onClick={() => setReceiptOrder(null)} variant="ghost">
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
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
                  {deleteTarget.order.tableNumber ? `Table ${deleteTarget.order.tableNumber}` : `Delivery Order #${deleteTarget.order.id}`}
                </span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleDeleteOrder(deleteTarget)}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider text-white transition"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-captain-black border border-white/10 hover:border-white py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />

      {/* Styled receipt print container overrides for Thermal size */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-area, #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            border: none;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
