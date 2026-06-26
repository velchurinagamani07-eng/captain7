import { motion } from "framer-motion";

export function Card({ children, className = "", hover = true, ...props }) {
  const MotionTag = hover ? motion.article : "article";
  const motionProps = hover ? { whileHover: { y: -4, borderColor: "#D4AF37" } } : {};
  return (
    <MotionTag
      className={`rounded-lg border border-white/10 bg-captain-card/88 p-5 shadow-gold backdrop-blur transition ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </MotionTag>
  );
}
