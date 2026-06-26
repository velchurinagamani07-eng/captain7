import { motion } from "framer-motion";
import { features } from "../../data/siteData.js";
import { BrandMark } from "../common/BrandMark.jsx";
import { SectionHeader } from "../common/SectionHeader.jsx";
import { Card } from "../ui/Card.jsx";

export function AboutSection() {
  return (
    <section className="bg-captain-black py-12">
      <div className="section-shell">
        <SectionHeader eyebrow="Narasaraopet" title="PLAY HARD. EAT WELL.">
          A dual venue built for after-college matches, family food runs, team parties, birthdays, and franchise-grade
          sports dining experiences.
        </SectionHeader>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div
            initial={{ x: -32, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center rounded-lg border border-captain-gold/25 bg-captain-charcoal/70 p-10 text-center"
          >
            <BrandMark size="lg" />
            <p className="mt-8 max-w-md text-base leading-7 text-white/66">
              Captain 7 brings box cricket energy and cafe hospitality together under one sharp black and gold brand.
              Book a slot, celebrate a win, order a combo, or build the model in your own city.
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="h-full">
                  <feature.icon className="mb-4 text-captain-bright" size={30} />
                  <h3 className="font-serif text-xl font-bold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/62">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
