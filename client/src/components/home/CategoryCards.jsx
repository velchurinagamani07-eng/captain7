import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChefHat, Trophy, ZoomIn } from "lucide-react";
import { useImageViewer } from "../../context/ImageViewerContext.jsx";

const categories = [
  {
    label: "Food Menu",
    icon: ChefHat,
    path: "/food-menu",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80"
  },
  {
    label: "Cricket Nets",
    icon: Trophy,
    path: "/cricket-booking",
    image: "https://images.unsplash.com/photo-1593766788306-28561086694e?auto=format&fit=crop&w=1200&q=80"
  }
];

export function CategoryCards() {
  const { openImageViewer } = useImageViewer();
  const categoryImages = categories.map((category) => ({
    id: category.label,
    url: category.image,
    title: category.label
  }));

  return (
    <section className="grid border-y border-captain-border bg-captain-black md:grid-cols-2">
      {categories.map((category, index) => (
        <motion.div
          key={category.label}
          className="relative"
          initial={{ y: 26, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55, delay: index * 0.08, ease: "easeOut" }}
        >
        <Link to={category.path} className="group relative block h-44 overflow-hidden border-captain-border md:h-56 md:border-r">
          <img
            src={category.image}
            alt={category.label}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <span className="absolute inset-0 bg-black/62" />
          <span className="relative flex h-full items-center justify-between px-6 md:px-10">
            <span>
              <span className="grid h-12 w-12 place-items-center rounded-lg border border-captain-gold/45 bg-captain-black/60 text-captain-bright shadow-gold">
                <category.icon size={25} />
              </span>
              <span className="mt-2 block font-bebas text-5xl text-white md:text-6xl">{category.label}</span>
            </span>
            <motion.span
              className="font-bebas text-5xl text-captain-bright"
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              &rarr;
            </motion.span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => openImageViewer({ images: categoryImages, index })}
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-captain-gold/45 bg-black/70 text-white shadow-gold transition hover:bg-captain-gold hover:text-captain-black"
          aria-label={`Open ${category.label} image`}
        >
          <ZoomIn size={17} />
        </button>
        </motion.div>
      ))}
    </section>
  );
}
