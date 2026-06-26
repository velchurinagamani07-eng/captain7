import { Link } from "react-router-dom";
import { CalendarCheck, Gift, QrCode, ShoppingBag, Star, User } from "lucide-react";
import { PageTransition } from "../components/common/PageTransition.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { sampleBookings, brand } from "../data/siteData.js";
import { useAuth } from "../hooks/useAuth.js";

export default function Dashboard() {
  const { user, demoSignIn } = useAuth();
  const activeUser = user || { name: "Guest", loyaltyPoints: 0 };

  return (
    <PageTransition>
      <section className="min-h-screen bg-captain-black pb-20 pt-32">
        <div className="section-shell">
          {!user ? (
            <div className="mb-6 rounded-lg border border-captain-gold/25 bg-captain-card p-5">
              <p className="text-white/68">You are viewing the demo dashboard. Sign in to connect Firebase Auth.</p>
              <Button onClick={() => demoSignIn("user")} className="mt-4">Demo Sign In</Button>
            </div>
          ) : null}
          <div className="mb-8 flex flex-col gap-4 rounded-lg border border-captain-gold/25 bg-captain-card p-6 shadow-gold md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-captain-gold text-captain-black">
                  <User size={22} />
                </span>
                <div>
                  <h1 className="font-serif text-3xl font-bold text-white">Welcome back, {activeUser.name}</h1>
                  <p className="text-white/52">Manage bookings, food orders, coupons, and profile settings.</p>
                </div>
              </div>
            </div>
            <Link to="/cricket-booking"><Button>Book Again</Button></Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card hover={false} className="lg:col-span-2">
              <h2 className="mb-5 flex items-center gap-2 font-serif text-2xl font-bold text-white">
                <CalendarCheck className="text-captain-gold" /> Upcoming Bookings
              </h2>
              <div className="grid gap-3">
                {sampleBookings.map((booking) => (
                  <div key={booking.id} className="flex flex-col gap-4 rounded-lg border border-white/10 bg-captain-black p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-mono text-captain-bright">{booking.id}</div>
                      <div className="mt-1 text-white">{booking.date} - {booking.time}</div>
                      <div className="text-sm capitalize text-white/45">{booking.status}</div>
                    </div>
                    <button className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/65">
                      <QrCode size={16} /> QR
                    </button>
                  </div>
                ))}
              </div>
            </Card>
            <div className="grid gap-5">
              <Card hover={false}>
                <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-bold text-white">
                  <Gift className="text-captain-gold" /> Loyalty
                </h2>
                <div className="font-mono text-4xl font-extrabold text-captain-bright">{activeUser.loyaltyPoints || 70}</div>
                <p className="mt-2 text-sm text-white/52">points available</p>
              </Card>
              <Card hover={false}>
                <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-bold text-white">
                  <ShoppingBag className="text-captain-gold" /> My Orders
                </h2>
                <p className="text-sm text-white/58">Food order statuses appear here in Firebase mode.</p>
              </Card>
              <Card hover={false}>
                <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-bold text-white">
                  <Star className="text-captain-gold" /> Review Prompt
                </h2>
                <a href={brand.reviewUrl} target="_blank" rel="noreferrer"><Button variant="secondary">Share Experience</Button></a>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
