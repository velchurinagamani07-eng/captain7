import { useMemo, useState } from "react";
import { HeroSlider } from "../components/home/HeroSlider.jsx";
import { PageTransition } from "../components/common/PageTransition.jsx";
import { SectionHeader } from "../components/common/SectionHeader.jsx";
import { MenuCard } from "../components/menu/MenuCard.jsx";
import { ComboCard } from "../components/menu/ComboCard.jsx";
import { FoodDetailModal } from "../components/menu/FoodDetailModal.jsx";
import { menuCategories, menuItems, combos } from "../data/siteData.js";
import { useAdminCollection } from "../hooks/useAdminCollection.js";

export default function FoodMenu() {
  const [category, setCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: firestoreItems, loading: loadingItems } = useAdminCollection("menuItems", "createdAt");
  const { data: firestoreCombos, loading: loadingCombos } = useAdminCollection("combos", "createdAt");

  // Use Firestore data if available, fallback to static
  const allItems = firestoreItems.length ? firestoreItems : menuItems;
  const allCombos = firestoreCombos.length ? firestoreCombos : combos;

  // Only show visible and active items
  const visibleItems = allItems.filter((item) => item.visible !== false && item.active !== false);

  const filteredItems = useMemo(
    () => (category === "All" ? visibleItems : visibleItems.filter((item) => item.category === category)),
    [category, visibleItems]
  );

  return (
    <PageTransition>
      <HeroSlider single pageKey="foodMenu" title="FOOD MENU" subtitle="SIGNATURE BITES" image="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1800&q=80" />
      <section className="bg-captain-black py-12">
        <div className="section-shell">
          <SectionHeader eyebrow="Admin Controlled Menu" title="ORDER FAVORITES">
            Browse categories, add items to cart, apply coupons, and place food orders with GST breakdown.
          </SectionHeader>
          <div className="sticky top-20 z-30 mb-8 overflow-x-auto border-y border-captain-gold/20 bg-captain-black/90 py-3 backdrop-blur-xl">
            <div className="flex min-w-max gap-2">
              {["All", ...menuCategories].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  className={`rounded-full px-4 py-2 font-nav text-xs font-extrabold uppercase tracking-[0.12em] transition ${
                    category === name ? "bg-captain-gold text-captain-black" : "border border-white/10 text-white/62 hover:text-captain-gold"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          {loadingItems ? (
            <p className="py-12 text-center text-white/45">Loading menu...</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredItems.map((item) => (
                <MenuCard key={item.id} item={item} onView={setSelectedItem} />
              ))}
            </div>
          )}
          <div className="mt-16">
            <SectionHeader eyebrow="Combos" title="DATE-AWARE OFFERS">
              Combo offers are ready for active periods, item selection, image upload, and cart checkout.
            </SectionHeader>
            {loadingCombos ? (
              <p className="py-8 text-center text-white/45">Loading combos...</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-3">
                {allCombos.map((combo) => (
                  <ComboCard key={combo.id} combo={combo} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <FoodDetailModal item={selectedItem} open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} />
    </PageTransition>
  );
}
