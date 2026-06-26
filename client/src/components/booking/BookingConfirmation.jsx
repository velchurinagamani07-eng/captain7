import { motion } from "framer-motion";
import { Check, Share2 } from "lucide-react";
import { brand } from "../../data/siteData.js";
import { Button } from "../ui/Button.jsx";

export function BookingConfirmation({ booking }) {
  return (
    <div className="rounded-lg border border-captain-gold/35 bg-captain-card p-8 text-center shadow-gold">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-captain-gold text-captain-black"
      >
        <Check size={42} />
      </motion.div>
      <h2 className="mt-6 font-display text-6xl text-white">BOOKING CONFIRMED</h2>
      <p className="mt-2 text-white/60">Your Captain 7 slot is locked.</p>
      <div className="mx-auto mt-6 max-w-sm rounded-lg border border-dashed border-captain-gold/50 bg-captain-black p-5">
        <div className="font-nav text-xs font-extrabold uppercase tracking-[0.18em] text-white/45">Booking ID</div>
        <div className="mt-2 font-mono text-2xl font-extrabold text-captain-bright">{booking.id}</div>
        <div className="mt-3 text-sm text-white/60">
          {booking.date} - {booking.slot?.startTime} to {booking.slot?.endTime}
        </div>
      </div>
      <a
        href={`https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(`My Captain 7 booking ID is ${booking.id}`)}`}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-block"
      >
        <Button icon={Share2}>Share On WhatsApp</Button>
      </a>
    </div>
  );
}
