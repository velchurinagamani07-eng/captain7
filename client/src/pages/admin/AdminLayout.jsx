import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut, Bell, Check, Trash, AlertCircle, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { adminNav } from "../../data/siteData.js";
import { BrandMark } from "../../components/common/BrandMark.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, writeBatch, limit, getDocs, where } from "firebase/firestore";
import { db } from "../../firebase.js";

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

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Monthly Report Alert State
  const [showReportAlert, setShowReportAlert] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    const today = new Date();
    if (today.getDate() === 1) {
      const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
      const lastDownloaded = localStorage.getItem("lastDownloadedMonth");
      if (lastDownloaded !== currentMonthKey) {
        setShowReportAlert(true);
      }
    }
  }, []);

  const handleDownloadMonthlyReport = async () => {
    setDownloadingReport(true);
    try {
      const usersSnapshot = await getDocs(query(collection(db, "users"), where("role", "==", "worker")));
      const workers = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentMonthKey = `${currentYear}-${currentMonth + 1}`;

      const statsMap = {};
      workers.forEach((w) => { statsMap[w.uid] = 0; });
      allOrders.forEach((order) => {
        const workerId = order.assignedTo;
        if (!workerId || statsMap[workerId] === undefined) return;
        const orderDate = order.deliveredAt?.seconds
          ? new Date(order.deliveredAt.seconds * 1000)
          : order.deliveredAt?.toDate
            ? order.deliveredAt.toDate()
            : order.deliveredAt
              ? new Date(order.deliveredAt)
              : null;
        if (order.status === "delivered" && orderDate && orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
          statsMap[workerId] += 1;
        }
      });

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Worker Name,Orders Delivered,Month\n";
      workers.forEach((w) => {
        const count = statsMap[w.uid] || 0;
        csvContent += `"${w.name}",${count},"${currentMonthKey}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Captain7_Worker_Report_${currentMonthKey}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      localStorage.setItem("lastDownloadedMonth", currentMonthKey);
      setShowReportAlert(false);
    } catch (err) {
      console.error("Failed to download report:", err);
      alert("Failed to download report. Please check connection and try again.");
    } finally {
      setDownloadingReport(false);
    }
  };

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const prevCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  // Real-time listener for /notifications
  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(25));
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
  }, []);

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

  const signOut = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <section className="min-h-screen bg-captain-black text-white">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-captain-gold/20 bg-captain-charcoal transition-[width] duration-300 xl:block ${
          collapsed ? "w-24" : "w-72"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className={`border-b border-white/10 p-5 ${collapsed ? "flex justify-center" : ""}`}>
            <BrandMark size="sm" withText={!collapsed} />
          </div>
          <nav className="flex-1 overflow-auto p-3">
            {adminNav.map((item) => (
              <NavLink
                key={item.path}
                end={item.path === "/admin"}
                to={item.path}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-3 rounded-lg border-l-2 py-3 text-sm transition ${
                    collapsed ? "justify-center px-2" : "px-4"
                  } ${
                    isActive
                      ? "border-captain-gold bg-captain-gold/10 text-captain-bright"
                      : "border-transparent text-white/60 hover:bg-white/[0.04] hover:text-white"
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed ? <span>{item.label}</span> : null}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm text-white/65 hover:border-captain-gold"
              aria-label={collapsed ? "Expand admin menu" : "Collapse admin menu"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!collapsed ? "Collapse menu" : null}
            </button>
          </div>
        </div>
      </aside>
      <div className={`transition-[padding] duration-300 ${collapsed ? "xl:pl-24" : "xl:pl-72"}`}>
        <header className="sticky top-0 z-30 border-b border-captain-gold/20 bg-captain-black/86 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-nav text-xs font-extrabold uppercase tracking-[0.22em] text-captain-gold">Admin Control System</div>
              <div className="text-sm text-white/50">Firestore-ready content management</div>
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
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-captain-gold/25 bg-captain-charcoal p-2 shadow-gold-strong z-50">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 px-2 text-xs uppercase tracking-wider font-semibold text-white/60">
                      <span>Notifications ({unreadCount} unread)</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-captain-bright hover:underline"
                        >
                          Mark all as read
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
                              className={`p-2.5 rounded-lg border transition ${
                                notif.isRead
                                  ? "border-white/5 bg-transparent opacity-60"
                                  : "border-captain-gold/15 bg-captain-gold/5"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-semibold text-xs text-white">{notif.title}</span>
                                <span className="text-[10px] text-white/40">{date}</span>
                              </div>
                              <p className="text-xs text-white/70 mt-1 leading-relaxed">{notif.message}</p>
                              <div className="mt-2.5 flex items-center justify-between gap-2">
                                {notif.link ? (
                                  <Link
                                    to={notif.link}
                                    onClick={() => setShowNotifDropdown(false)}
                                    className="rounded bg-captain-gold/20 hover:bg-captain-gold/30 text-captain-bright px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    View
                                  </Link>
                                ) : (
                                  <span />
                                )}
                                {!notif.isRead && (
                                  <button
                                    type="button"
                                    onClick={() => markAsRead(notif.id)}
                                    className="text-white/40 hover:text-white"
                                    title="Mark as read"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}
                              </div>
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
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/65 hover:border-captain-gold"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </header>
        <main className="p-4 py-8 lg:p-8">
          {showReportAlert && (
            <div className="mb-6 flex flex-col gap-4 rounded-lg border border-captain-gold bg-captain-gold/10 p-5 md:flex-row md:items-center md:justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <AlertCircle className="shrink-0 text-captain-bright animate-bounce" size={24} />
                <div>
                  <h4 className="font-bebas text-xl tracking-wider text-captain-bright">Monthly Report Alert</h4>
                  <p className="text-sm text-white/70">It is the 1st of the month. Download the worker performance report for this month.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDownloadMonthlyReport}
                  disabled={downloadingReport}
                  className="inline-flex items-center gap-2 rounded bg-captain-gold hover:bg-captain-gold-hover px-4 py-2 text-xs font-bold text-captain-black transition disabled:opacity-50"
                >
                  <Download size={14} />
                  {downloadingReport ? "Downloading..." : "Download CSV"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
                    localStorage.setItem("lastDownloadedMonth", currentMonthKey);
                    setShowReportAlert(false);
                  }}
                  className="inline-flex items-center gap-2 rounded border border-white/10 hover:bg-white/5 px-4 py-2 text-xs font-bold text-white transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </section>
  );
}
