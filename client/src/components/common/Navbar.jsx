import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Menu, Phone, X } from "lucide-react";
import { brand } from "../../data/siteData.js";
import { useAuth } from "../../hooks/useAuth.js";
import { InstallAppButton } from "./InstallAppButton.jsx";
import { BrandMark } from "./BrandMark.jsx";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Cricket", path: "/cricket-booking" },
  { label: "Menu", path: "/food-menu" },
  { label: "Packages", path: "/party-packages" },
  { label: "Gallery", path: "/gallery" },
  { label: "Contact", path: "/contact" },
  { label: "Franchise", path: "/franchise" }
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-9 z-50 hidden border-b transition-all duration-300 md:block ${
          scrolled
            ? "border-captain-gold/50 bg-captain-black/90 py-2 backdrop-blur-xl"
            : "border-white/5 bg-captain-black/78 py-3 backdrop-blur-xl"
        }`}
      >
        <nav className="section-shell flex items-center justify-between gap-4">
          <Link to="/" aria-label="Captain 7 home" className={scrolled ? "scale-95 transition" : "transition"}>
            <BrandMark size="sm" />
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `group relative font-nav text-xs font-extrabold uppercase tracking-[0.18em] transition ${
                    isActive ? "text-captain-bright" : "text-white/78 hover:text-captain-gold"
                  }`
                }
              >
                {link.label}
                <span className="absolute -bottom-2 left-0 h-0.5 w-full scale-x-0 bg-captain-gold transition group-hover:scale-x-100 group-[.active]:scale-x-100" />
              </NavLink>
            ))}
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <InstallAppButton compact />
            <a
              href={`https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(brand.whatsappMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="grid h-11 w-11 place-items-center rounded-full border border-emerald-400/35 bg-emerald-500/15 text-emerald-200 transition hover:border-emerald-300"
              aria-label="WhatsApp Captain 7"
            >
              <MessageCircle size={19} />
            </a>
            {user?.role === "admin" ? (
              <Link
                to="/admin"
                className="rounded-lg border border-captain-gold/45 px-4 py-2.5 font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white transition hover:border-captain-gold hover:text-captain-bright"
              >
                Admin Panel
              </Link>
            ) : user?.role === "worker" ? (
              <Link
                to="/worker/dashboard"
                className="rounded-lg border border-captain-gold/45 px-4 py-2.5 font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white transition hover:border-captain-gold hover:text-captain-bright"
              >
                Worker Panel
              </Link>
            ) : null}
          </div>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-captain-gold/35 text-captain-gold lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Open menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-40 bg-captain-black px-6 pb-8 pt-24 lg:hidden"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            <div className="mx-auto flex h-full max-w-md flex-col">
              <div className="mb-8 flex justify-center">
                <BrandMark size="md" />
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <NavLink
                      to={link.path}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4 font-nav text-sm font-extrabold uppercase tracking-[0.16em] text-white"
                    >
                      <span className="h-2 w-2 rounded-full bg-captain-gold" />
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(brand.whatsappMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-4 font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white"
                >
                  <MessageCircle size={18} /> WhatsApp
                </a>
                <a
                  href={`tel:${brand.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-captain-gold px-4 py-4 font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-captain-black"
                >
                  <Phone size={18} /> Call
                </a>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
