import { ShoppingCart, Star } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { useCart } from "../../hooks/useCart.js";
import { Badge } from "../ui/Badge.jsx";
import { Card } from "../ui/Card.jsx";

export function MenuCard({ item, onView }) {
  const { addItem } = useCart();

  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0">
      <button
        type="button"
        onClick={() => onView?.(item)}
        className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-captain-surface text-left"
        aria-label={`View ${item.name} details`}
      >
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Veg/Non-veg indicator dot top-left of image */}
        <span className={`absolute left-3 top-3 z-10 h-3 w-3 rounded-full border ${
          item.isVeg ? "border-emerald-300 bg-emerald-500" : "border-red-300 bg-red-500"
        }`} />
        {item.isBestseller ? <Badge className="absolute right-3 top-3">Bestseller</Badge> : null}
      </button>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <button type="button" onClick={() => onView?.(item)} className="text-left">
              <h3 className="font-semibold text-sm text-white line-clamp-1">{item.name}</h3>
            </button>
            <div className="mt-1 flex items-center gap-3 text-xs text-white/55">
              {item.rating ? (
                <span className="inline-flex items-center gap-1">
                  <Star size={12} className="fill-captain-gold text-captain-gold" /> {item.rating}
                </span>
              ) : null}
            </div>
          </div>
          <div className="font-bebas text-2xl text-captain-bright">{formatCurrency(item.price)}</div>
        </div>
        <p className="mt-3 flex-1 text-sm leading-6 text-white/58">{item.description}</p>
        <button
          type="button"
          onClick={() => addItem(item)}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-captain-gold bg-captain-gold px-4 py-3 font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-captain-black opacity-100 transition hover:bg-captain-bright md:opacity-0 md:group-hover:opacity-100"
        >
          <ShoppingCart size={16} /> Add to Cart
        </button>
      </div>
    </Card>
  );
}
