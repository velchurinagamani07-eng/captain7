import { motion } from "framer-motion";

export function SectionHeader({ eyebrow, title, children, align = "center" }) {
  return (
    <motion.div
      initial={{ y: 32, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={`mx-auto mb-10 max-w-3xl ${align === "center" ? "text-center" : "text-left"}`}
    >
      {eyebrow ? (
        <div className="mb-3 font-nav text-xs font-extrabold uppercase tracking-[0.26em] text-captain-gold">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="font-display text-5xl leading-none text-white md:text-7xl">{title}</h2>
      <div className={`mt-4 h-px w-36 bg-captain-gold ${align === "center" ? "mx-auto" : ""}`} />
      {children ? <p className="mt-5 text-base leading-7 text-white/64">{children}</p> : null}
    </motion.div>
  );
}
