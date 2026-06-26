import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { ZoomIn } from "lucide-react";
import { Navigation, Pagination, Autoplay, EffectFade, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { heroSlides } from "../../data/siteData.js";
import { Button } from "../ui/Button.jsx";
import { InstallAppButton } from "../common/InstallAppButton.jsx";
import { useImageViewer } from "../../context/ImageViewerContext.jsx";
import { useHeroImage } from "../../hooks/useSettings.js";

export function HeroSlider({ single = false, title = "CAPTAIN 7", subtitle = "EAT - PLAY - CELEBRATE", image, pageKey = "home" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { openImageViewer } = useImageViewer();
  const cleanTitle = title.split(/\s+/).slice(0, 6).join(" ");
  const storedImage = useHeroImage(pageKey, image || heroSlides[0].image);
  const homeSlides = storedImage && pageKey === "home"
    ? [{ ...heroSlides[0], image: storedImage }, ...heroSlides.slice(1)]
    : heroSlides;
  const slides = single
    ? [
        {
          id: "single",
          title: cleanTitle,
          kicker: subtitle,
          image: storedImage || image || heroSlides[0].image
        },
        ...homeSlides.slice(0, 3).map((slide) => ({ ...slide, title: cleanTitle }))
      ]
    : homeSlides;
  const viewerImages = slides.map((slide, index) => ({
    id: slide.id || `hero-${index}`,
    url: slide.image,
    title: slide.caption || slide.title || `Hero ${index + 1}`
  }));

  return (
    <section className="relative h-[52svh] min-h-[320px] max-h-[430px] overflow-hidden bg-captain-black md:h-[calc(100vh-118px)] md:min-h-[560px] md:max-h-none">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade, Keyboard]}
        effect="fade"
        speed={850}
        autoplay={{ delay: 2000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        navigation
        keyboard={{ enabled: true }}
        loop
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="absolute inset-0 h-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id}>
            <div className="relative h-[52svh] min-h-[320px] max-h-[430px] overflow-hidden md:h-[calc(100vh-118px)] md:min-h-[560px] md:max-h-none">
              <button
                type="button"
                onClick={() => openImageViewer({ images: viewerImages, index })}
                className="group absolute inset-0 cursor-zoom-in text-left"
                aria-label={`Open ${slide.caption || slide.title} image`}
              >
                <img
                  src={slide.image}
                  alt={slide.caption || slide.title}
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-xl"
                  loading="eager"
                />
                <motion.img
                  src={slide.image}
                  alt={slide.caption || slide.title}
                  className="absolute inset-0 h-full w-full object-contain md:object-cover"
                  loading="eager"
                  initial={{ scale: 1.04 }}
                  animate={{ scale: 1.01 }}
                  transition={{ duration: 2.2, ease: "easeOut" }}
                />
                <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-captain-gold/45 bg-black/60 text-white opacity-100 shadow-gold backdrop-blur transition hover:bg-captain-gold hover:text-captain-black md:opacity-0 md:group-hover:opacity-100">
                  <ZoomIn size={18} />
                </span>
              </button>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.36),rgba(0,0,0,.78))] md:bg-[linear-gradient(135deg,rgba(0,0,0,.78),rgba(0,0,0,.35))]" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_75%,#0A0A0A_100%)]" />
      <div className="pointer-events-none section-shell relative z-10 flex h-full items-end pb-11 pt-24 md:pb-16 md:pt-0">
        <motion.div
          key={activeIndex}
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.55 }}
          className="pointer-events-auto max-w-4xl text-left"
        >
          <h1 className="font-bebas text-[clamp(2.4rem,12vw,8rem)] leading-none text-white drop-shadow-[0_2px_18px_rgba(0,0,0,.7)]">
            {cleanTitle}
          </h1>
          {!single ? (
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/cricket-booking">
                <Button showArrow className="min-w-44">BOOK NOW</Button>
              </Link>
              <InstallAppButton />
            </div>
          ) : null}
        </motion.div>
      </div>
      <div className="absolute bottom-4 right-4 z-10 font-bebas text-xl text-captain-bright md:bottom-7 md:right-10 md:text-3xl">
        {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>
    </section>
  );
}
