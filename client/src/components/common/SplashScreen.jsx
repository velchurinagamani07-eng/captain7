import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandMark } from "./BrandMark.jsx";

export function SplashScreen() {
  const [visible, setVisible] = useState(() => sessionStorage.getItem("captain7:splashShown") !== "true");

  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(() => {
      sessionStorage.setItem("captain7:splashShown", "true");
      setVisible(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [visible]);

  const dismiss = () => {
    sessionStorage.setItem("captain7:splashShown", "true");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          onClick={dismiss}
          className="fixed inset-0 z-[130] grid place-items-center bg-captain-black text-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          aria-label="Dismiss splash screen"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div
              initial={{ scale: 0.4, y: -40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              className="relative"
            >
              <BrandMark size="lg" withText={false} />
              <span className="orbit absolute left-1/2 top-1/2 h-5 w-5 rounded-full border border-white/70 bg-red-700 shadow-gold">
                <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/70" />
              </span>
            </motion.div>
            <div>
              <motion.h1
                className="overflow-hidden whitespace-nowrap font-display text-6xl text-captain-bright md:text-8xl"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, ease: "easeInOut" }}
              >
                CAPTAIN 7
              </motion.h1>
              <motion.p
                className="font-script text-2xl font-bold text-captain-bright"
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                animate={{ opacity: 1, letterSpacing: "0.12em" }}
                transition={{ delay: 1.05, duration: 0.5 }}
              >
                Eat & Play
              </motion.p>
              <motion.div
                className="mx-auto mt-5 h-px w-64 bg-captain-gold"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.25, duration: 0.6 }}
              />
            </div>
            <div className="fixed bottom-0 left-0 h-1 w-full bg-white/5">
              <motion.div
                className="h-full bg-captain-gold"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "linear" }}
              />
            </div>
          </div>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
