import { Clock, MapPin, MessageCircle, Phone, Utensils } from "lucide-react";
import { brand } from "../../data/siteData.js";

const cards = [
  { icon: MapPin, label: "Restaurant", value: brand.restaurantAddress },
  { icon: MapPin, label: "Sports Zone", value: brand.sportsAddress },
  { icon: Phone, label: "Phone", value: brand.phone },
  { icon: Clock, label: "Sports Hours", value: "Mon: 4 PM-10:30 PM | Tue-Sun: 11 AM-10:30 PM" },
  { icon: Utensils, label: "Restaurant Hours", value: "11 AM-11 PM" }
];

export function ContactInfo() {
  return (
    <div className="grid gap-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-lg border border-captain-gold/25 bg-captain-card p-5">
          <div className="flex gap-4">
            <card.icon size={22} className="mt-1 shrink-0 text-captain-gold" />
            <div>
              <div className="font-nav text-xs font-extrabold uppercase tracking-[0.15em] text-white/45">{card.label}</div>
              <div className="mt-1 text-white/78">{card.value}</div>
            </div>
          </div>
        </article>
      ))}
      <a
        href={`https://wa.me/${brand.whatsappNumber}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-3 rounded-full bg-emerald-500 px-5 py-4 font-nav text-sm font-extrabold uppercase tracking-[0.14em] text-white"
      >
        <MessageCircle size={20} /> WhatsApp
      </a>
    </div>
  );
}
