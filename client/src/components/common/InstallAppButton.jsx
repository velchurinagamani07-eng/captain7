import { Download } from "lucide-react";
import { usePwaInstall } from "../../context/PwaInstallContext.jsx";

export function InstallAppButton({ className = "", compact = false }) {
  const { canInstall, installApp } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={installApp}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-captain-gold bg-captain-gold font-nav font-extrabold uppercase tracking-[0.14em] text-captain-black shadow-gold transition hover:bg-captain-bright ${compact ? "h-11 px-4 text-xs" : "px-5 py-3 text-sm"} ${className}`}
    >
      <Download size={compact ? 16 : 18} />
      {compact ? "Install" : "Install App"}
    </button>
  );
}
