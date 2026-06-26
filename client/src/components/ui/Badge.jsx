export function Badge({ children, tone = "gold", className = "" }) {
  const tones = {
    gold: "border-captain-gold/50 bg-captain-gold/12 text-captain-bright",
    green: "border-emerald-400/50 bg-emerald-500/12 text-emerald-200",
    grey: "border-white/20 bg-white/10 text-white/70",
    red: "border-red-400/50 bg-red-500/12 text-red-200"
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
