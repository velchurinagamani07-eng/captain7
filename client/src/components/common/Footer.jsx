import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { brand } from "../../data/siteData.js";
import { BrandMark } from "./BrandMark.jsx";

const quickLinks = [
  ["Cricket Booking", "/cricket-booking"],
  ["Food Menu", "/food-menu"],
  ["Party Packages", "/party-packages"],
  ["Franchise", "/franchise"],
  ["Contact", "/contact"]
];

export function Footer() {
  return (
    <footer className="border-t border-captain-gold/25 bg-captain-black pt-14">
      <div className="section-shell grid gap-10 pb-10 lg:grid-cols-[1.1fr_0.7fr_1fr_1.2fr]">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">{brand.tagline}</p>
          <div className="mt-5 flex gap-3">
            {[Instagram, Facebook, Mail].map((Icon) => (
              <a
                key={Icon.displayName || Icon.name}
                href="mailto:hello@captain7.local"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-captain-gold hover:text-captain-gold"
                aria-label="Captain 7 social link"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-nav text-sm font-extrabold uppercase tracking-[0.2em] text-captain-gold">Quick Links</h3>
          <div className="mt-5 grid gap-3">
            {quickLinks.map(([label, path]) => (
              <Link key={path} to={path} className="text-sm text-white/68 transition hover:text-captain-gold">
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-nav text-sm font-extrabold uppercase tracking-[0.2em] text-captain-gold">Contact</h3>
          <div className="mt-5 grid gap-4 text-sm text-white/68">
            <p className="flex gap-3">
              <MapPin className="mt-1 shrink-0 text-captain-gold" size={18} />
              <span>{brand.restaurantAddress}</span>
            </p>
            <p className="flex gap-3">
              <TrophyIcon />
              <span>{brand.sportsAddress}</span>
            </p>
            <a className="flex items-center gap-3 hover:text-captain-gold" href={`tel:${brand.phone.replace(/\s/g, "")}`}>
              <Phone size={18} className="text-captain-gold" />
              {brand.phone}
            </a>
            <a
              className="flex items-center gap-3 hover:text-emerald-200"
              href={`https://wa.me/${brand.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} className="text-emerald-300" />
              WhatsApp
            </a>
          </div>
        </div>
        <div>
          <h3 className="font-nav text-sm font-extrabold uppercase tracking-[0.2em] text-captain-gold">Find Us</h3>
          <div className="mt-5 overflow-hidden rounded-lg border border-captain-gold/25">
            <iframe
              title="Captain 7 map"
              src={brand.mapsEmbed}
              className="h-56 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        Copyright Captain 7 Eat & Play. FSSAI License No. {brand.fssai}
      </div>
    </footer>
  );
}

function TrophyIcon() {
  return <span className="mt-0.5 shrink-0 font-display text-xl leading-none text-captain-gold">7</span>;
}
