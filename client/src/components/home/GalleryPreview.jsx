import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ZoomIn } from "lucide-react";
import { galleryImages } from "../../data/siteData.js";
import { Button } from "../ui/Button.jsx";
import { useImageViewer } from "../../context/ImageViewerContext.jsx";

export function GalleryPreview() {
  const { openImageViewer } = useImageViewer();
  const previewImages = galleryImages.slice(0, 6);

  return (
    <section className="bg-captain-black py-12">
      <div className="section-shell">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="font-nav text-xs font-extrabold uppercase tracking-[0.18em] text-captain-gold">Gallery</div>
            <h2 className="font-bebas text-5xl text-white">CAPTAIN MOMENTS</h2>
          </div>
          <Link to="/gallery" className="hidden md:block"><Button variant="secondary">View All</Button></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {previewImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ y: 22, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
            >
            <button
              type="button"
              onClick={() => openImageViewer({ images: previewImages, index })}
              className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg border border-white/10 text-left"
              aria-label={`Open ${image.title} image`}
            >
              <img
                src={image.url}
                alt={image.title}
                className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute left-3 bottom-3 grid h-9 w-9 place-items-center rounded-full border border-captain-gold/45 bg-black/70 text-white shadow-gold transition group-hover:bg-captain-gold group-hover:text-captain-black">
                <ZoomIn size={16} />
              </span>
            </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
