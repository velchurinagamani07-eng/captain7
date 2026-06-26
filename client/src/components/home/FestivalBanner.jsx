import { useEffect, useMemo, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { useCollection } from "../../hooks/useFirestore.js";

export function FestivalBanner() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("captain7:festivalDismissed") === "true");
  const { data: festivalsList } = useCollection("festivals", [], { live: true });
  
  const activeFestival = useMemo(() => {
    return festivalsList.find((f) => f.active);
  }, [festivalsList]);

  useEffect(() => {
    if (!activeFestival) {
      sessionStorage.removeItem("captain7:festivalDismissed");
    }
  }, [activeFestival]);

  if (!activeFestival || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem("captain7:festivalDismissed", "true");
    setDismissed(true);
  };

  return (
    <section className="bg-captain-black px-4 py-8 flex justify-center no-print">
      <div className="relative w-full max-w-lg rounded-xl border border-captain-gold/30 bg-captain-card p-5 md:p-6 shadow-gold flex flex-col justify-between">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-white/10 hover:border-captain-gold text-white/50 hover:text-white transition"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>

        {activeFestival.imageUrl && (
          <div className="aspect-[21/9] w-full overflow-hidden rounded-lg bg-captain-black border border-white/5 mb-4">
            <img src={activeFestival.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-3">
          <div className="font-nav text-[10px] font-extrabold uppercase tracking-[0.2em] text-captain-gold">
            Special Announcement
          </div>
          <h2 className="font-serif text-xl font-bold text-white leading-snug">
            {activeFestival.caption}
          </h2>
          {activeFestival.creditText && (
            <p className="text-xs text-white/40 italic leading-relaxed font-sans">
              {activeFestival.creditText}
            </p>
          )}
          {activeFestival.buttonUrl && (
            <a
              href={activeFestival.buttonUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-captain-gold hover:bg-captain-gold-hover px-5 py-2.5 font-nav text-xs font-extrabold uppercase tracking-wider text-captain-black transition mt-1"
            >
              {activeFestival.buttonText || "Go To Website"} <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
export default FestivalBanner;
