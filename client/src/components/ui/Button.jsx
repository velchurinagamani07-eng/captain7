import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const variants = {
  primary:
    "shimmer-button bg-shimmer text-captain-black border-captain-gold shadow-gold hover:shadow-gold-strong",
  secondary:
    "bg-captain-card text-white border-captain-gold/45 hover:border-captain-gold hover:text-captain-bright",
  ghost:
    "bg-transparent text-white border-white/15 hover:border-captain-gold hover:text-captain-gold",
  danger:
    "bg-red-950/60 text-red-100 border-red-500/40 hover:border-red-400"
};

export function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  showArrow = false,
  icon: Icon,
  ...props
}) {
  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-7 py-4 text-base"
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full border font-nav font-extrabold uppercase tracking-[0.14em] transition ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={18} aria-hidden="true" /> : null}
      <span>{children}</span>
      {showArrow ? <ArrowRight size={18} aria-hidden="true" /> : null}
    </motion.button>
  );
}
