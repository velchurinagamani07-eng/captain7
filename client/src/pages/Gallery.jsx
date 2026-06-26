import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { HeroSlider } from "../components/home/HeroSlider.jsx";
import { PageTransition } from "../components/common/PageTransition.jsx";
import { SectionHeader } from "../components/common/SectionHeader.jsx";
import { galleryImages } from "../data/siteData.js";
import { useImageViewer } from "../context/ImageViewerContext.jsx";
import { useAdminCollection } from "../hooks/useAdminCollection.js";

const filters = ["All", "Cricket", "Food", "Events", "Venue", "Celebrations"];

export default function Gallery() {
  const [filter, setFilter] = useState("All");
  const { openImageViewer } = useImageViewer();
  const { data, loading } = useAdminCollection("gallery", "createdAt");

  // Use Firestore data if available, fallback to static
  const allImages = data.length ? data : galleryImages;

  const images = useMemo(
    () => (filter === "All" ? allImages : allImages.filter((image) => image.category === filter)),
    [filter, allImages]
  );

  return (
    <PageTransition>
      <HeroSlider single pageKey="gallery" title="GALLERY" subtitle="CAPTAIN MOMENTS" image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80" />
      <section className="bg-captain-black py-12">
        <div className="section-shell">
          <SectionHeader eyebrow="Venue, Food, Cricket" title="VISUAL WALL">
            Masonry gallery with category filters, featured ordering, and full-screen lightbox.
          </SectionHeader>
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {filters.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setFilter(name)}
                className={`rounded-full px-4 py-2 font-nav text-xs font-extrabold uppercase tracking-[0.12em] ${
                  filter === name ? "bg-captain-gold text-captain-black" : "border border-white/10 text-white/62"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          {loading ? (
            <p className="py-12 text-center text-white/45">Loading gallery...</p>
          ) : (
            <div className="masonry">
              {images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() =>
                    openImageViewer({
                      images,
                      index: images.findIndex((item) => item.id === image.id)
                    })
                  }
                  className="group relative block w-full overflow-hidden rounded-lg border border-white/10 bg-captain-card text-left shadow-gold"
                >
                  <img src={image.url} alt={image.title} loading="lazy" className="w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/35" />
                  <span className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-captain-gold text-captain-black">
                      <Eye size={20} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
