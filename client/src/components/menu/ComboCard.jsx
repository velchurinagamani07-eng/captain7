import { ShoppingCart } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { useCart } from "../../hooks/useCart.js";
import { Badge } from "../ui/Badge.jsx";

export function ComboCard({ combo }) {
  const { addCombo } = useCart();

  return (
    <article className="relative min-h-[330px] overflow-hidden rounded-lg border border-captain-gold/25 bg-captain-card shadow-gold">
      <div className="absolute inset-0">
        <img src={combo.image} alt={combo.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" loading="lazy" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/72 to-black/30" />
      <div className="pointer-events-none relative flex h-full min-h-[330px] flex-col justify-end p-5">
        <Badge className="absolute left-4 top-4">Combo</Badge>
        <h3 className="font-display text-4xl text-white">{combo.name}</h3>
        <p className="mt-2 text-sm leading-6 text-white/68">{combo.items.join(" + ")}</p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="font-mono text-sm text-white/45 line-through">{formatCurrency(combo.originalPrice)}</div>
            <div className="font-mono text-3xl font-extrabold text-captain-bright">{formatCurrency(combo.price)}</div>
          </div>
          <button
            type="button"
            onClick={() => addCombo(combo)}
            className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-captain-gold text-captain-black transition hover:bg-captain-bright"
            aria-label={`Add ${combo.name} to cart`}
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}
