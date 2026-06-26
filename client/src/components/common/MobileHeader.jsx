import { Link, useLocation } from "react-router-dom";
import { Bell, ShoppingBag } from "lucide-react";
import { BrandMark } from "./BrandMark.jsx";
import { useCart } from "../../hooks/useCart.js";

const titles = {
  "/": "Home",
  "/cricket-booking": "Book",
  "/food-menu": "Menu",
  "/party-packages": "Packages",
  "/gallery": "Gallery",
  "/contact": "Contact",
  "/dashboard": "Account"
};

export function MobileHeader() {
  const location = useLocation();
  const { setOpen, itemCount } = useCart();
  const isMenu = location.pathname === "/food-menu";
  const title = titles[location.pathname] || "Captain 7";

  return (
    <header className="fixed inset-x-0 top-9 z-[60] h-14 border-b border-captain-border bg-captain-black/94 px-3 backdrop-blur-xl md:hidden">
      <div className="grid h-full grid-cols-[44px_1fr_44px] items-center">
        <Link to="/" aria-label="Home" className="scale-75 origin-left">
          <BrandMark size="sm" withText={false} />
        </Link>
        <div className="text-center font-nav text-xs font-extrabold uppercase tracking-[0.18em] text-white">
          {title}
        </div>
        <button
          type="button"
          onClick={() => (isMenu ? setOpen(true) : undefined)}
          className="relative grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-captain-bright"
          aria-label={isMenu ? "Open cart" : "Notifications"}
        >
          {isMenu ? <ShoppingBag size={18} /> : <Bell size={17} />}
          {isMenu && itemCount ? (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-captain-gold px-1 font-mono text-[10px] font-bold text-captain-black">
              {itemCount}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
}
