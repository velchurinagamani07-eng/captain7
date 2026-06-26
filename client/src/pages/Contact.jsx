import { useState } from "react";
import { HeroSlider } from "../components/home/HeroSlider.jsx";
import { PageTransition } from "../components/common/PageTransition.jsx";
import { SectionHeader } from "../components/common/SectionHeader.jsx";
import { ContactForm, FranchiseForm } from "../components/contact/LeadForms.jsx";
import { ContactInfo } from "../components/contact/ContactInfo.jsx";
import { brand } from "../data/siteData.js";

export default function Contact() {
  const [tab, setTab] = useState("contact");

  return (
    <PageTransition>
      <HeroSlider single pageKey="contact" title="CONTACT" subtitle="WE ARE READY" image="https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1800&q=80" />
      <section className="bg-captain-black py-12">
        <div className="section-shell">
          <SectionHeader eyebrow="Narasaraopet" title="VISIT CAPTAIN 7">
            Reach the restaurant, sports zone, party team, or franchise desk from one place.
          </SectionHeader>
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-5">
              <div className="overflow-hidden rounded-lg border border-captain-gold/25">
                <iframe
                  title="Captain 7 location"
                  src={brand.mapsEmbed}
                  className="h-[360px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <ContactInfo />
            </div>
            <div>
              <div className="mb-4 grid grid-cols-2 rounded-full border border-captain-gold/25 bg-captain-card p-1">
                {[
                  ["contact", "Contact"],
                  ["franchise", "Franchise"]
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`rounded-full px-4 py-3 font-nav text-xs font-extrabold uppercase tracking-[0.14em] ${
                      tab === id ? "bg-captain-gold text-captain-black" : "text-white/60"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {tab === "contact" ? <ContactForm /> : <FranchiseForm compact />}
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
