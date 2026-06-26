import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CalendarClock, 
  Mail, 
  ShoppingBag, 
  Trophy, 
  AlertCircle, 
  Download, 
  Loader2, 
  Users, 
  Layers, 
  Clock, 
  CheckCircle,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminStatCard } from "../../components/admin/AdminStatCard.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { useCollection } from "../../hooks/useFirestore.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { openCustomerWhatsApp } from "../../utils/whatsapp.js";

export default function AdminOverview() {
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [leadsModalOpen, setLeadsModalOpen] = useState(false);

  const { data: bookings, loading: loadingBookings } = useCollection("bookings", [], { live: true });
  const { data: orders, loading: loadingOrders } = useCollection("orders", [], { live: true });
  const { data: contactLeads, loading: loadingContactLeads } = useCollection("contactLeads", [], { live: true });
  const { data: franchiseLeads, loading: loadingFranchiseLeads } = useCollection("franchiseLeads", [], { live: true });
  const { data: timeSlots, loading: loadingSlots } = useCollection("timeSlots", [], { live: true });
  const { data: users, loading: loadingUsers } = useCollection("users", [], { live: true });

  useEffect(() => {
    const today = new Date();
    if (today.getDate() === 1) {
      const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
      const dismissed = localStorage.getItem(`captain7:monthlyAlertDismissed:${currentMonthKey}`);
      if (dismissed !== "true") setShowAlert(true);
    }
  }, []);

  // Compute live statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Today's Bookings
    const todayBookings = bookings.filter((b) => b.date === todayStr && b.status !== "cancelled");
    const cricketRevenueToday = todayBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0);

    // Today's Food Orders
    const todayOrders = orders.filter((o) => {
      const oDate = o.createdAt?.seconds
        ? new Date(o.createdAt.seconds * 1000).toISOString().slice(0, 10)
        : o.createdAt?.toDate
          ? o.createdAt.toDate().toISOString().slice(0, 10)
          : "";
      return oDate === todayStr && o.status !== "cancelled";
    });
    const foodRevenueToday = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    // Pending Orders count
    const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;

    // Active Cricket Slots count
    const activeSlotsCount = timeSlots.filter((s) => s.status === "active").length;

    // Leads in last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const contact7Days = contactLeads.filter((l) => {
      const time = l.createdAt?.seconds
        ? l.createdAt.seconds * 1000
        : l.createdAt?.toDate
          ? l.createdAt.toDate().getTime()
          : 0;
      return time >= sevenDaysAgo;
    }).length;
    const franchise7Days = franchiseLeads.filter((l) => {
      const time = l.createdAt?.seconds
        ? l.createdAt.seconds * 1000
        : l.createdAt?.toDate
          ? l.createdAt.toDate().getTime()
          : 0;
      return time >= sevenDaysAgo;
    }).length;

    const totalWorkers = users.filter((u) => u.role === "worker").length;

    return {
      bookingsCount: todayBookings.length,
      revenueToday: cricketRevenueToday + foodRevenueToday,
      pendingOrders: pendingOrdersCount,
      activeSlots: activeSlotsCount,
      newLeads: contact7Days + franchise7Days,
      workersCount: totalWorkers,
      usersCount: users.length
    };
  }, [bookings, orders, contactLeads, franchiseLeads, timeSlots, users]);

  // Combine and sort leads for modal view
  const allLeads = useMemo(() => {
    const list = [
      ...contactLeads.map(l => ({ ...l, type: "Contact" })),
      ...franchiseLeads.map(l => ({ ...l, type: "Franchise" }))
    ];
    return list.sort((a, b) => {
      const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
      const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
      return bTime - aTime;
    });
  }, [contactLeads, franchiseLeads]);

  // Compute 30-day chart data
  const chartData = useMemo(() => {
    const results = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dateLabel = d.toLocaleDateString([], { month: "short", day: "numeric" });
      
      const dayBookings = bookings.filter((b) => b.date === dateStr && b.status !== "cancelled");
      const bookRev = dayBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0);
      
      const dayOrders = orders.filter((o) => {
        const oDate = o.createdAt?.seconds
          ? new Date(o.createdAt.seconds * 1000).toISOString().slice(0, 10)
          : o.createdAt?.toDate
            ? o.createdAt.toDate().toISOString().slice(0, 10)
            : "";
        return oDate === dateStr && o.status === "delivered";
      });
      const foodRev = dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      
      results.push({ name: dateLabel, bookings: bookRev, food: foodRev, total: bookRev + foodRev });
    }
    return results;
  }, [bookings, orders]);

  // Live recent feeds
  const recentBookingsList = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds : 0;
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [bookings]);

  const recentOrdersList = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds : 0;
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [orders]);

  const downloadMonthlyReport = () => {
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
    const workers = users.filter((u) => u.role === "worker");
    const workerStats = {};
    workers.forEach((w) => { workerStats[w.uid] = 0; });
    orders.forEach((o) => {
      if (o.status !== "delivered" || !o.assignedTo || workerStats[o.assignedTo] === undefined) return;
      const oDate = o.deliveredAt?.seconds
        ? new Date(o.deliveredAt.seconds * 1000)
        : o.deliveredAt?.toDate
          ? o.deliveredAt.toDate()
          : null;
      if (oDate && oDate.getMonth() === today.getMonth() && oDate.getFullYear() === today.getFullYear()) {
        workerStats[o.assignedTo] += 1;
      }
    });
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Worker Name,Orders Delivered,Month\n";
    workers.forEach((w) => {
      csvContent += `"${w.name}",${workerStats[w.uid] || 0},"${currentMonthKey}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Captain7_Worker_Report_${currentMonthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    localStorage.setItem(`captain7:monthlyAlertDismissed:${currentMonthKey}`, "true");
    setShowAlert(false);
  };

  const handleOpenWhatsApp = (lead) => {
    const msg = `Hi ${lead.name || "there"}, this is Captain 7 support reaching out regarding your ${lead.type} enquiry.`;
    openCustomerWhatsApp(lead.phone, msg);
  };

  return (
    <div className="space-y-6">
      {showAlert && (
        <div className="flex flex-col gap-4 rounded-lg border border-captain-gold bg-captain-gold/10 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="shrink-0 text-captain-bright animate-bounce" size={24} />
            <div>
              <h4 className="font-bebas text-xl tracking-wider text-captain-bright">Monthly Report Alert</h4>
              <p className="text-sm text-white/70">It is the 1st of the month. Download the worker performance report for this month.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button size="sm" icon={Download} onClick={downloadMonthlyReport}>Download CSV</Button>
            <Button size="sm" variant="ghost" onClick={() => {
              const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
              localStorage.setItem(`captain7:monthlyAlertDismissed:${currentMonthKey}`, "true");
              setShowAlert(false);
            }}>Dismiss</Button>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-5xl text-white">OVERVIEW</h1>
          <p className="mt-2 text-sm text-white/55">Real-time business operations feed, metrics, and actions.</p>
        </div>
      </div>

      {/* Metrics Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Today's Bookings" value={String(stats.bookingsCount)} icon={CalendarClock} />
        <AdminStatCard label="Today's Revenue" value={formatCurrency(stats.revenueToday)} icon={Trophy} />
        <AdminStatCard label="Pending Food Orders" value={String(stats.pendingOrders)} icon={ShoppingBag} />
        <AdminStatCard label="Active Cricket Slots" value={String(stats.activeSlots)} icon={Clock} />
      </div>

      {/* Metrics Row 2 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-captain-gold/10 bg-captain-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">New Leads (7d)</div>
            <div className="mt-2 font-bebas text-3xl text-captain-bright">{stats.newLeads}</div>
          </div>
          <Mail className="text-captain-gold/40" size={32} />
        </div>
        <div className="rounded-lg border border-captain-gold/10 bg-captain-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total Workers</div>
            <div className="mt-2 font-bebas text-3xl text-captain-bright">{stats.workersCount}</div>
          </div>
          <Users className="text-captain-gold/40" size={32} />
        </div>
        <div className="rounded-lg border border-captain-gold/10 bg-captain-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total Users</div>
            <div className="mt-2 font-bebas text-3xl text-captain-bright">{stats.usersCount}</div>
          </div>
          <Layers className="text-captain-gold/40" size={32} />
        </div>
      </div>

      {/* Quick Action Buttons */}
      <Card hover={false} className="p-5">
        <h3 className="mb-4 font-nav text-xs font-extrabold uppercase tracking-wider text-captain-gold">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => navigate("/admin/orders")} icon={ShoppingBag}>
            View Pending Orders
          </Button>
          <Button onClick={() => navigate("/admin/orders")} variant="secondary" icon={Users}>
            Assign Workers
          </Button>
          <Button onClick={() => setLeadsModalOpen(true)} variant="ghost" icon={Mail} className="border border-white/10 text-white hover:border-captain-gold hover:text-captain-bright">
            View Leads
          </Button>
        </div>
      </Card>

      {/* Chart and Feeds */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Revenue Trend Area Chart */}
        <Card hover={false} className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-white">Revenue Trend — Last 30 Days</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#555" tickLine={false} style={{ fontSize: "10px" }} />
                <YAxis stroke="#555" tickLine={false} style={{ fontSize: "10px" }} />
                <Tooltip contentStyle={{ background: "#111111", border: "1px solid #C9A84C", color: "#fff" }} />
                <Area type="monotone" dataKey="total" stroke="#C9A84C" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="Combined Revenue" />
                <Area type="monotone" dataKey="bookings" stroke="#e8c96a" strokeWidth={1.5} fill="none" name="Cricket Bookings" />
                <Area type="monotone" dataKey="food" stroke="#ffffff" strokeWidth={1.5} fill="none" name="Food Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live Feeds */}
        <div className="space-y-6">
          {/* Recent Bookings Feed */}
          <Card hover={false} className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <CalendarClock className="text-captain-gold" size={18} /> Recent Bookings Feed
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {loadingBookings ? (
                <div className="py-8 flex justify-center"><Spinner /></div>
              ) : recentBookingsList.length === 0 ? (
                <p className="text-sm text-white/40 py-4 text-center">No bookings scheduled.</p>
              ) : (
                recentBookingsList.map((booking) => (
                  <div key={booking.id} className="rounded-lg border border-white/5 bg-captain-black/40 p-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-white">{booking.userName}</div>
                      <div className="text-white/45 mt-0.5">{booking.date} — {booking.startTime}</div>
                    </div>
                    <Badge tone={booking.status === "confirmed" ? "green" : "grey"}>{booking.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Food Orders Feed */}
          <Card hover={false} className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="text-captain-gold" size={18} /> Recent Food Orders Feed
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {loadingOrders ? (
                <div className="py-8 flex justify-center"><Spinner /></div>
              ) : recentOrdersList.length === 0 ? (
                <p className="text-sm text-white/40 py-4 text-center">No orders placed yet.</p>
              ) : (
                recentOrdersList.map((order) => (
                  <div key={order.id} className="rounded-lg border border-white/5 bg-captain-black/40 p-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-white">#{order.id} — {order.customerName}</div>
                      <div className="text-white/45 mt-0.5">Total: {formatCurrency(order.total)}</div>
                    </div>
                    <Badge tone={order.status === "delivered" ? "green" : "gold"}>{order.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Dynamic View Leads Modal */}
      <Modal open={leadsModalOpen} onClose={() => setLeadsModalOpen(false)} title="Contact & Franchise Leads Manager">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto text-sm text-white/70 pr-1">
          {allLeads.length === 0 ? (
            <p className="py-12 text-center text-white/40">No contact or franchise leads found.</p>
          ) : (
            <div className="space-y-4">
              {allLeads.map((lead) => (
                <div key={lead.id} className="rounded-lg border border-white/10 bg-captain-black p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Badge tone={lead.type === "Franchise" ? "gold" : "grey"}>{lead.type} Lead</Badge>
                      <span className="font-semibold text-white">{lead.name}</span>
                    </div>
                    <Badge tone={lead.status === "new" ? "gold" : "green"}>{lead.status}</Badge>
                  </div>
                  <div className="grid gap-1.5 text-xs">
                    <div><span className="text-white/40">Phone:</span> {lead.phone}</div>
                    {lead.email && <div><span className="text-white/40">Email:</span> {lead.email}</div>}
                    {lead.city && <div><span className="text-white/40">City:</span> {lead.city}</div>}
                    {lead.budget && <div><span className="text-white/40">Budget:</span> {lead.budget}</div>}
                    {lead.subject && <div><span className="text-white/40">Subject:</span> {lead.subject}</div>}
                    <div className="mt-1 p-2 bg-white/5 rounded text-white/80 leading-relaxed font-sans">
                      {lead.message || "No message left."}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-white/45">
                      {lead.createdAt?.seconds 
                        ? new Date(lead.createdAt.seconds * 1000).toLocaleString() 
                        : "Just now"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(lead)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition"
                    >
                      <MessageSquare size={13} /> WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function Spinner() {
  return <Loader2 size={18} className="animate-spin text-captain-gold" />;
}