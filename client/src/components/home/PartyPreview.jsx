import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { partyPackages } from "../../data/siteData.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";

export function PartyPreview() {
  return (
    <section className="bg-captain-charcoal py-12">
      <div className="section-shell">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-nav text-xs font-extrabold uppercase tracking-[0.25em] text-captain-gold">
              Party Packages
            </div>
            <h2 className="mt-3 font-display text-6xl text-white md:text-7xl">CELEBRATE IN STYLE</h2>
          </div>
          <Link to="/party-packages">
            <Button variant="secondary">Explore Packages</Button>
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {partyPackages.map((pack) => (
            <article
              key={pack.id}
              className={`rounded-lg border bg-captain-card p-6 shadow-gold transition hover:-translate-y-1 ${
                pack.isMostPopular ? "border-captain-gold" : "border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-white">{pack.name}</h3>
                  <p className="mt-1 text-sm text-white/52">{pack.tier}</p>
                </div>
                <Badge>{pack.badge}</Badge>
              </div>
              <div className="mt-6 font-mono text-3xl font-extrabold text-captain-bright">
                {formatCurrency(pack.price)}
                <span className="ml-2 text-sm text-white/45">{pack.priceType}</span>
              </div>
              <ul className="mt-5 grid gap-3 text-sm text-white/66">
                {pack.inclusions.slice(0, 4).map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check size={16} className="mt-0.5 shrink-0 text-captain-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
