import { useState } from "react";
import { Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { Modal } from "../ui/Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { useCart } from "../../hooks/useCart.js";

export function FoodDetailModal({ item, open, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const { addItem } = useCart();

  if (!item) return null;

  const currentPrice = selectedVariant ? selectedVariant.price : item.price;

  const add = () => {
    const finalItem = selectedVariant 
      ? { ...item, name: `${item.name} (${selectedVariant.name})`, price: selectedVariant.price }
      : item;
    
    Array.from({ length: quantity }).forEach(() => addItem(finalItem));
    onClose();
    setQuantity(1);
    setSelectedVariant(null);
  };

  return (
    <Modal open={open} onClose={onClose} title={item.name} className="max-w-3xl">
      <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-captain-black">
          <img src={item.image} alt={item.name} className="aspect-square w-full rounded-lg object-cover transition duration-500 hover:scale-105" />
          {item.isBestseller ? <span className="absolute left-3 top-3 rounded-full bg-captain-gold px-3 py-1 font-nav text-[11px] font-extrabold uppercase tracking-[0.12em] text-captain-black">Bestseller</span> : null}
        </div>
        <div>
          <div className="mb-3 flex items-center gap-3 text-sm text-white/60">
            <span className={`h-3 w-3 rounded-full ${item.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
            {item.isVeg ? "Veg" : "Non-veg"}
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">{item.category}</span>
            {item.rating ? (
              <span className="inline-flex items-center gap-1">
                <Star size={14} className="fill-captain-gold text-captain-gold" /> {item.rating}
              </span>
            ) : null}
          </div>
          <div className="rounded-lg border border-white/10 bg-captain-black p-4">
            <div className="font-nav text-xs font-extrabold uppercase tracking-[0.15em] text-captain-gold">About This Dish</div>
            <p className="mt-3 text-sm leading-6 text-white/66">{item.description}</p>
          </div>

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs uppercase tracking-widest text-white/40">Select Option</div>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      selectedVariant?.name === v.name
                        ? "border-captain-gold bg-captain-gold/10 text-captain-bright"
                        : "border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {v.name} (₹{v.price})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 font-bebas text-5xl text-captain-bright">{formatCurrency(currentPrice)}</div>
          <div className="mt-5 rounded-lg border border-white/10 bg-captain-black p-4">
            <div className="mb-3 font-nav text-xs font-extrabold uppercase tracking-[0.15em] text-white/45">Quantity</div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="grid h-10 w-10 place-items-center rounded-full border border-white/10">
                <Minus size={16} />
              </button>
              <span className="grid h-10 min-w-12 place-items-center rounded-lg bg-white/5 font-bebas text-2xl">{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <Button onClick={add} icon={ShoppingCart} className="mt-5 w-full">Add To Cart</Button>
        </div>
      </div>
    </Modal>
  );
}
