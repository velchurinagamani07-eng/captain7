import { MessageCircle, Phone } from "lucide-react";
import { brand } from "../../data/siteData.js";

export function FloatingActions() {
  return (
    <div className="fixed bottom-24 right-5 z-40 flex flex-col gap-3 md:bottom-6">
      <a
        href={`tel:${brand.phone.replace(/\s/g, "")}`}
        title="Call Us"
        className="hidden h-16 w-16 place-items-center rounded-full border border-captain-bright bg-captain-gold text-captain-black shadow-gold md:grid"
        style={{ animation: "ripple 4s ease-out infinite" }}
        aria-label="Call Captain 7"
      >
        <Phone size={24} />
      </a>
      <a
        href={`https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent("Hi Captain 7! I want to know more about your services.")}`}
        target="_blank"
        rel="noreferrer"
        title="WhatsApp"
        className="grid h-14 w-14 place-items-center rounded-full border border-emerald-200/70 bg-emerald-500 text-white shadow-gold md:h-16 md:w-16"
        aria-label="WhatsApp Captain 7"
      >
        <MessageCircle size={25} />
      </a>
    </div>
  );
}
