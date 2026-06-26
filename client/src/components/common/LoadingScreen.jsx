import { AnimatePresence, motion } from "framer-motion";
import { BrandMark } from "./BrandMark.jsx";

export function LoadingScreen({ active }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          className="fixed inset-0 z-[120] grid place-items-center bg-captain-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="relative grid place-items-center"
          >
            <motion.span
              className="absolute h-32 w-32 rounded-full border border-captain-gold"
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 1.45, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            <BrandMark size="lg" withText={false} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
