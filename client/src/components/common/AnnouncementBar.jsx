import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useDocument } from "../../hooks/useFirestore.js";

export const defaultAnnouncementMessages = [
  {
    text: "Website made by WayzenTech",
    cta: "Call 9398724704",
    link: "tel:9398724704"
  },
  {
    text: "Order food & win coupons!",
    cta: "Order Now",
    link: "/food-menu"
  },
  {
    text: "Franchise available",
    highlight: "Rs. 2.5 LAKHS",
    cta: "Know More",
    link: "/franchise"
  }
];

export function AnnouncementBar({ messages }) {
  const { data } = useDocument("settings/announcements", { messages: messages || defaultAnnouncementMessages });
  const sourceMessages = data.messages || messages || defaultAnnouncementMessages;
  const [index, setIndex] = useState(0);
  const active = sourceMessages.filter((item) => item.isActive !== false);
  const message = active.length ? active[index % active.length] : null;

  useEffect(() => {
    if (!active.length) return undefined;
    const timer = setInterval(() => setIndex((current) => (current + 1) % active.length), 3000);
    return () => clearInterval(timer);
  }, [active.length]);

  if (!message) return null;
  const external = message.link?.startsWith("tel:");
  const content = (
    <span className="inline-flex items-center justify-center gap-3">
      <span>{message.text}</span>
      {message.highlight ? <span className="font-bebas text-lg text-captain-bright">{message.highlight}</span> : null}
      <span className="font-nav text-[10px] font-extrabold uppercase tracking-[0.15em] text-captain-bright">
        {message.cta}
      </span>
    </span>
  );

  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-9 overflow-hidden border-b border-captain-border bg-captain-black text-center text-xs text-white/75">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${message.text}-${index}`}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="grid h-9 place-items-center px-3"
        >
          {external ? (
            <a href={message.link} className="w-full">
              {content}
            </a>
          ) : (
            <Link to={message.link} className="w-full">
              {content}
            </Link>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
