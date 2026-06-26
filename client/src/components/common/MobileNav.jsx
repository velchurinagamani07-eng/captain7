import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { HiCalendar, HiHome, HiPhotograph, HiUser } from "react-icons/hi";
import { MdRestaurantMenu } from "react-icons/md";

const tabs = [
  { label: "Home", path: "/", icon: HiHome },
  { label: "Book", path: "/cricket-booking", icon: HiCalendar },
  { label: "Menu", path: "/food-menu", icon: MdRestaurantMenu },
  { label: "Gallery", path: "/gallery", icon: HiPhotograph }
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[65] border-t border-captain-border bg-captain-black/92 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl md:hidden">
      <div className="grid h-16 grid-cols-4">
        {tabs.map((tab) => (
          <NavLink key={tab.path} to={tab.path} end={tab.path === "/"}>
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] ${
                  isActive ? "text-captain-bright" : "text-white/45"
                }`}
              >
                <tab.icon size={22} />
                <span>{tab.label}</span>
                <span className={`h-1 w-1 rounded-full ${isActive ? "bg-captain-bright" : "bg-transparent"}`} />
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
