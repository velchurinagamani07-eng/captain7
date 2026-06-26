import { AnimatePresence, motion } from "framer-motion";

export function Toast({ message, tone = "gold" }) {
  const tones = {
    gold: "border-captain-gold/50 bg-captain-charcoal text-captain-bright",
    green: "border-emerald-400/45 bg-emerald-950 text-emerald-100",
    red: "border-red-400/45 bg-red-950 text-red-100"
  };

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 18, opacity: 0 }}
          className={`fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-full border px-5 py-3 text-sm shadow-gold ${tones[tone]}`}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
