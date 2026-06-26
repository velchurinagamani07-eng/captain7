import { combos } from "../../data/siteData.js";
import { SectionHeader } from "../common/SectionHeader.jsx";
import { ComboCard } from "../menu/ComboCard.jsx";

export function ComboSection() {
  return (
    <section className="bg-captain-charcoal py-12">
      <div className="section-shell">
        <SectionHeader eyebrow="Admin Controlled" title="COMBO OFFERS">
          Date-aware combo cards are ready for Firestore management and food cart checkout.
        </SectionHeader>
        <div className="grid gap-5 md:grid-cols-3">
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      </div>
    </section>
  );
}
