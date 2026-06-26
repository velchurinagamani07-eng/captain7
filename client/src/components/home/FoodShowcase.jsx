import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { menuItems } from "../../data/siteData.js";
import { SectionHeader } from "../common/SectionHeader.jsx";
import { Button } from "../ui/Button.jsx";
import { MenuCard } from "../menu/MenuCard.jsx";

export function FoodShowcase() {
  return (
    <section className="bg-captain-black py-12">
      <div className="section-shell">
        <SectionHeader eyebrow="Signature Bites" title="BESTSELLERS">
          Cricket evenings taste better with cafe favorites, quick snacks, mocktails, pizzas, burgers, and combos.
        </SectionHeader>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {menuItems.slice(0, 6).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
            >
              <MenuCard item={item} />
            </motion.div>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link to="/food-menu">
            <Button showArrow>View Full Menu</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
