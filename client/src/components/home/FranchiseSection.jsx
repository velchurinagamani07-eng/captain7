import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button.jsx";

const bullets = ["Low Investment", "Full Brand Support", "Proven Model", "High ROI"];

export function FranchiseSection() {
  return (
    <section className="hidden border-y border-captain-gold/25 bg-captain-charcoal py-12 lg:block">
      <div className="section-shell grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="font-nav text-xs font-extrabold uppercase tracking-[0.25em] text-captain-gold">
            Franchise
          </div>
          <h2 className="mt-3 font-display text-7xl leading-none text-white">OWN A CAPTAIN 7 FRANCHISE</h2>
          <p className="mt-4 max-w-2xl font-serif text-2xl text-captain-bright">
            Premium Sports & Dining Venue Starting at Rs. 2,50,000
          </p>
        </div>
        <div className="rounded-lg border border-captain-gold/35 bg-captain-black p-6 shadow-gold">
          <div className="grid gap-4 sm:grid-cols-2">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-center gap-3 text-white/76">
                <CheckCircle2 size={20} className="text-captain-gold" />
                {bullet}
              </div>
            ))}
          </div>
          <Link to="/franchise" className="mt-7 inline-block">
            <Button showArrow>Enquire Now</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
