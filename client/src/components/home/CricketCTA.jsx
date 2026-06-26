import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { useSlots } from "../../hooks/useslots.js";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";

export function CricketCTA() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const { slots } = useSlots(selectedDate);
  const available = useMemo(() => slots.filter((slot) => slot.status === "active").slice(0, 5), [slots]);

  return (
    <section className="relative overflow-hidden bg-captain-charcoal py-12">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.12) 1px, transparent 1px)",
          backgroundSize: "56px 56px"
        }}
      />
      <div className="section-shell relative grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <div className="font-nav text-xs font-extrabold uppercase tracking-[0.25em] text-captain-gold">
            Live Booking
          </div>
          <h2 className="mt-3 font-bebas text-6xl leading-none text-white md:text-8xl">BOOK YOUR PITCH</h2>
          <p className="mt-4 max-w-xl text-lg leading-8 text-white/68">
            Narasaraopet's premier box cricket experience with live slot visibility, add-ons, coupon support, and
            Razorpay-ready checkout.
          </p>
        </div>
        <div className="rounded-lg border border-captain-gold/30 bg-captain-black/78 p-5 shadow-gold">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="grid gap-2">
              <span className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">Date</span>
              <input
                type="date"
                value={selectedDate}
                min={today}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-lg border border-white/10 bg-captain-surface px-4 py-3 text-white outline-none focus:border-captain-gold"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">Time</span>
              <select className="rounded-lg border border-white/10 bg-captain-surface px-4 py-3 text-white outline-none focus:border-captain-gold">
                {available.map((slot) => (
                  <option key={slot.id}>{slot.startTime} - {slot.endTime}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Link to="/cricket-booking" className="w-full md:w-auto">
                <Button className="w-full" icon={CalendarDays}>Check</Button>
              </Link>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {slots.map((slot) => (
              <Badge key={slot.id} tone={slot.status === "active" ? "gold" : "grey"} className={slot.status !== "active" ? "line-through" : ""}>
                {slot.startTime}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
