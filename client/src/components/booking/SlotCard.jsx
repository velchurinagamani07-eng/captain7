import { motion } from "framer-motion";
import { Clock, Users } from "lucide-react";
import { Badge } from "../ui/Badge.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";

export function SlotCard({ slot, selected, onSelect }) {
  const available = slot.status === "active";
  const statusTone = available ? "gold" : slot.status === "reserved" ? "green" : "grey";
  const label = available ? "Available" : slot.status === "reserved" ? "Reserved" : "Booked";

  return (
    <motion.button
      type="button"
      disabled={!available}
      whileHover={available ? { scale: 1.02, borderColor: "#D4AF37" } : {}}
      onClick={() => onSelect(slot)}
      className={`w-full rounded-lg border p-4 text-left transition ${
        selected
          ? "border-emerald-400 bg-emerald-500/10"
          : available
            ? "border-captain-gold/40 bg-captain-card"
            : "border-white/10 bg-white/[0.04] text-white/45"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`font-mono text-lg font-extrabold ${!available ? "line-through" : ""}`}>
            {slot.startTime} - {slot.endTime}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
            <span className="inline-flex items-center gap-1">
              <Clock size={13} /> {slot.duration}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users size={13} /> Max {slot.maxPlayers}
            </span>
          </div>
        </div>
        <Badge tone={statusTone}>{selected ? "Selected" : label}</Badge>
      </div>
      <div className="mt-4 font-mono text-2xl font-extrabold text-captain-bright">{formatCurrency(slot.price)}</div>
    </motion.button>
  );
}
