import { Check, ZoomIn } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";
import { useImageViewer } from "../../context/ImageViewerContext.jsx";

export function PackageCard({ pack, onBook }) {
  const { openImageViewer } = useImageViewer();
  const packageImages = pack.images.map((image, index) => ({
    id: `${pack.id}-${index}`,
    url: image,
    title: `${pack.name} ${index + 1}`
  }));

  return (
    <motion.article
      whileHover={{ scale: 1.03, borderColor: "#D4AF37" }}
      className={`rounded-lg border bg-captain-card p-6 shadow-gold ${pack.isMostPopular ? "border-captain-gold" : "border-white/10"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl font-bold text-white">{pack.name}</h3>
          <p className="mt-1 text-sm text-white/45">{pack.tier}</p>
        </div>
        <Badge>{pack.badge}</Badge>
      </div>
      <div className="mt-5 font-mono text-4xl font-extrabold text-captain-bright">
        {formatCurrency(pack.price)}
        <span className="ml-2 text-sm text-white/45">{pack.priceType}</span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {packageImages.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => openImageViewer({ images: packageImages, index })}
            className="group relative cursor-zoom-in overflow-hidden rounded-lg border border-white/10"
            aria-label={`Open ${image.title} image`}
          >
            <img src={image.url} alt={image.title} className="aspect-square rounded-lg object-cover transition duration-500 hover:scale-105" loading="lazy" />
            <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-captain-gold text-captain-black">
                <ZoomIn size={16} />
              </span>
            </span>
          </button>
        ))}
      </div>
      <ul className="mt-5 grid gap-3 text-sm text-white/68">
        {pack.inclusions.map((item) => (
          <li key={item} className="flex gap-3">
            <Check size={16} className="mt-0.5 shrink-0 text-captain-gold" />
            {item}
          </li>
        ))}
      </ul>
      <Button onClick={() => onBook(pack)} className="mt-6 w-full">
        Book This Package
      </Button>
    </motion.article>
  );
}
