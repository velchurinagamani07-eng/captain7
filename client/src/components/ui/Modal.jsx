import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, className = "" }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/78 px-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            className={`max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-captain-gold/35 bg-captain-charcoal p-5 shadow-gold-strong ${className}`}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-serif text-2xl font-bold text-white">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/75 transition hover:border-captain-gold hover:text-captain-gold"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
