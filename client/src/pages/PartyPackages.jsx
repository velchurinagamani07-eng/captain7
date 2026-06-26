import { useState } from "react";
import { HeroSlider } from "../components/home/HeroSlider.jsx";
import { PageTransition } from "../components/common/PageTransition.jsx";
import { SectionHeader } from "../components/common/SectionHeader.jsx";
import { PackageCard } from "../components/party/PackageCard.jsx";
import { BookingModal } from "../components/party/BookingModal.jsx";
import { reviews, partyPackages } from "../data/siteData.js";
import { Star } from "lucide-react";
import { useAdminCollection } from "../hooks/useAdminCollection.js";

export default function PartyPackages() {
  const [selected, setSelected] = useState(null);
  const { data, loading } = useAdminCollection("partyPackages", "createdAt");

  // Use Firestore data if available, fallback to static
  const allPackages = data.length ? data : partyPackages;

  return (
    <PageTransition>
      <HeroSlider single pageKey="partyPackages" title="CELEBRATE IN STYLE" subtitle="" image="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1800&q=80" />
      <section className="bg-captain-black py-12">
        <div className="section-shell">
          <SectionHeader eyebrow="Party Packages" title="CHOOSE YOUR TIER">
            Admin-managed packages cover birthday, corporate, anniversary, and team events.
          </SectionHeader>
          {loading ? (
            <p className="py-12 text-center text-white/45">Loading packages...</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3">
              {allPackages.map((pack) => (
                <PackageCard key={pack.id} pack={pack} onBook={setSelected} />
              ))}
            </div>
          )}
          <div className="mt-16">
            <SectionHeader eyebrow="Testimonials" title="PAST CELEBRATIONS" />
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.slice(0, 3).map((review) => (
                <article key={review.id} className="rounded-lg border border-white/10 bg-captain-card p-5">
                  <div className="mb-3 flex gap-1">
                    {Array.from({ length: review.stars }).map((_, index) => (
                      <Star key={index} size={15} className="fill-captain-gold text-captain-gold" />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-white/65">{review.text}</p>
                  <div className="mt-4 font-semibold text-white">{review.name}</div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <BookingModal pack={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </PageTransition>
  );
}
