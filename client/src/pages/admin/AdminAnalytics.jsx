import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { BarChart3, Clock, Eye, Smartphone, Monitor, Globe, Navigation, ArrowUpRight, Activity, Loader2 } from "lucide-react";
import { useCollection } from "../../hooks/useFirestore.js";
import { Card } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";

const COLORS = ["#C9A84C", "#FFFFFF", "#555555", "#888888"];

export default function AdminAnalytics() {
  const { data: pageViews, loading } = useCollection("pageViews", [], { live: true });

  // Calculate stats
  const stats = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const fiveMinsAgo = now - 5 * 60 * 1000;

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    const activeSessions = new Set();

    pageViews.forEach((pv) => {
      const pvTime = pv.timestamp?.seconds
        ? pv.timestamp.seconds * 1000
        : pv.timestamp?.toDate
          ? pv.timestamp.toDate().getTime()
          : typeof pv.timestamp === "number"
            ? pv.timestamp
            : 0;

      if (pvTime >= todayStart) todayCount++;
      if (pvTime >= sevenDaysAgo) weekCount++;
      if (pvTime >= thirtyDaysAgo) monthCount++;
      
      if (pvTime >= fiveMinsAgo && pv.sessionId) {
        activeSessions.add(pv.sessionId);
      }
    });

    return {
      today: todayCount,
      week: weekCount,
      month: monthCount,
      liveVisitors: activeSessions.size
    };
  }, [pageViews]);

  // Chart Data 1: Most Visited Pages (Bar Chart)
  const mostVisitedPages = useMemo(() => {
    const counts = {};
    pageViews.forEach((pv) => {
      const path = pv.path || "/";
      counts[path] = (counts[path] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [pageViews]);

  // Chart Data 2: Device Breakdown (Pie Chart)
  const deviceBreakdown = useMemo(() => {
    let mobile = 0;
    let desktop = 0;

    pageViews.forEach((pv) => {
      if (pv.deviceType === "mobile") mobile++;
      else desktop++;
    });

    return [
      { name: "Mobile", value: mobile },
      { name: "Desktop", value: desktop }
    ];
  }, [pageViews]);

  // Chart Data 3: Hourly Traffic for Today (Area Chart)
  const hourlyTrafficToday = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const hourlyCounts = Array(24).fill(0);

    pageViews.forEach((pv) => {
      const pvTime = pv.timestamp?.seconds
        ? pv.timestamp.seconds * 1000
        : pv.timestamp?.toDate
          ? pv.timestamp.toDate().getTime()
          : typeof pv.timestamp === "number"
            ? pv.timestamp
            : 0;

      if (pvTime >= todayStart) {
        const date = new Date(pvTime);
        const hour = date.getHours();
        hourlyCounts[hour]++;
      }
    });

    return hourlyCounts.map((count, hour) => {
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      return {
        time: `${displayHour} ${ampm}`,
        views: count
      };
    });
  }, [pageViews]);

  // Recent visits feed
  const recentVisits = useMemo(() => {
    return [...pageViews]
      .sort((a, b) => {
        const aTime = a.timestamp?.seconds ? a.timestamp.seconds : 0;
        const bTime = b.timestamp?.seconds ? b.timestamp.seconds : 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [pageViews]);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-captain-gold mb-3" size={28} />
        <p className="text-sm text-white/50">Loading real-time analytics database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-5xl text-white">REAL-TIME ANALYTICS</h1>
          <p className="mt-2 text-sm text-white/55">Track live visitor footprint, traffic sources, page views, and user devices.</p>
        </div>
        {stats.liveVisitors > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 animate-pulse">
            <Activity size={14} />
            {stats.liveVisitors} Live {stats.liveVisitors === 1 ? "Visitor" : "Visitors"}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card hover={false} className="p-4 border border-captain-gold/10">
          <div className="text-xs text-white/45 uppercase tracking-wider font-semibold">Page Views Today</div>
          <div className="mt-2 font-bebas text-4xl text-captain-bright">{stats.today}</div>
        </Card>
        <Card hover={false} className="p-4 border border-captain-gold/10">
          <div className="text-xs text-white/45 uppercase tracking-wider font-semibold">Page Views This Week</div>
          <div className="mt-2 font-bebas text-4xl text-white">{stats.week}</div>
        </Card>
        <Card hover={false} className="p-4 border border-captain-gold/10">
          <div className="text-xs text-white/45 uppercase tracking-wider font-semibold">Page Views This Month</div>
          <div className="mt-2 font-bebas text-4xl text-white">{stats.month}</div>
        </Card>
        <Card hover={false} className="p-4 border border-captain-gold/10">
          <div className="text-xs text-white/45 uppercase tracking-wider font-semibold">Live Visitor Count (5m)</div>
          <div className="mt-2 font-bebas text-4xl text-emerald-400">{stats.liveVisitors}</div>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hourly Traffic Area Chart */}
        <Card hover={false} className="lg:col-span-2 space-y-4">
          <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-captain-gold" size={18} /> Today's Traffic Curve (Hourly)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrafficToday}>
                <defs>
                  <linearGradient id="analyticsCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#555" tickLine={false} style={{ fontSize: "9px" }} />
                <YAxis stroke="#555" tickLine={false} style={{ fontSize: "9px" }} />
                <Tooltip contentStyle={{ background: "#111111", border: "1px solid #C9A84C", color: "#fff" }} />
                <Area type="monotone" dataKey="views" stroke="#C9A84C" strokeWidth={2.5} fillOpacity={1} fill="url(#analyticsCurve)" name="Page Views" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Device Breakdown Pie Chart */}
        <Card hover={false} className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <Smartphone className="text-captain-gold" size={18} /> Device Footprint
          </h2>
          <div className="h-60 relative flex items-center justify-center">
            {deviceBreakdown[0].value === 0 && deviceBreakdown[1].value === 0 ? (
              <p className="text-xs text-white/40">No views registered today.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111111", border: "1px solid #C9A84C", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-6 text-xs mt-2">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-captain-gold" /> Mobile ({deviceBreakdown[0].value})</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-white" /> Desktop ({deviceBreakdown[1].value})</span>
          </div>
        </Card>
      </div>

      {/* Pages and Logs Row */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Most Visited Pages Bar Chart */}
        <Card hover={false} className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <Globe className="text-captain-gold" size={18} /> Most Visited Pages (Hits)
          </h2>
          <div className="h-80">
            {mostVisitedPages.length === 0 ? (
              <p className="py-12 text-center text-white/40 text-xs">No page traffic recorded.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mostVisitedPages} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" stroke="#555" tickLine={false} style={{ fontSize: "10px" }} />
                  <YAxis dataKey="path" type="category" stroke="#555" tickLine={false} style={{ fontSize: "10px" }} width={120} />
                  <Tooltip contentStyle={{ background: "#111111", border: "1px solid #C9A84C", color: "#fff" }} />
                  <Bar dataKey="count" fill="#C9A84C" radius={[0, 4, 4, 0]} name="Hits" barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Live Visitor Feed Logs */}
        <Card hover={false} className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <Navigation className="text-captain-gold" size={18} /> Real-time Activity Feed
          </h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {recentVisits.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-8">No visits recorded yet.</p>
            ) : (
              recentVisits.map((visit, idx) => {
                const date = visit.timestamp?.seconds 
                  ? new Date(visit.timestamp.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                  : "Just now";
                return (
                  <div key={visit.id || idx} className="rounded border border-white/5 bg-captain-black/40 p-2.5 flex justify-between items-start text-[11px]">
                    <div className="space-y-1">
                      <div className="font-semibold text-captain-bright font-mono break-all">{visit.path}</div>
                      <div className="flex gap-2 text-white/40 text-[9px] uppercase">
                        <span>{visit.browser}</span>
                        <span>•</span>
                        <span>{visit.deviceType}</span>
                        {visit.referrer && visit.referrer !== "direct" && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[100px]">{visit.referrer}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-white/45 font-mono text-[9px] whitespace-nowrap">{date}</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
export { AdminAnalytics };
