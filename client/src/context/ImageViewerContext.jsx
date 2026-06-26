import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  X
} from "lucide-react";
import { Spinner } from "../components/ui/Spinner.jsx";

const ImageViewerContext = createContext(null);
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

function clamp(value, min = MIN_ZOOM, max = MAX_ZOOM) {
  return Math.min(max, Math.max(min, value));
}

function getTouchDistance(touches) {
  if (touches.length < 2) return 0;
  const [first, second] = touches;
  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

function normalizeImages(images = []) {
  return images
    .map((image, index) =>
      typeof image === "string"
        ? { id: image, url: image, title: `Image ${index + 1}` }
        : {
            id: image.id || image.url || image.image || `image-${index}`,
            url: image.url || image.image || image.imageUrl || image.src,
            title: image.title || image.name || image.caption || `Image ${index + 1}`
          }
    )
    .filter((image) => image.url);
}

export function ImageViewerProvider({ children }) {
  const [state, setState] = useState({ open: false, images: [], index: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const pinchRef = useRef({ distance: 0, zoom: 1 });

  const activeImage = state.images[state.index];

  const resetImage = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  const close = useCallback(() => {
    setState((current) => ({ ...current, open: false }));
    resetImage();
  }, [resetImage]);

  const openImageViewer = useCallback(({ images, index = 0 }) => {
    const normalized = normalizeImages(images);
    if (!normalized.length) return;
    setState({ open: true, images: normalized, index: Math.min(index, normalized.length - 1) });
    setZoom(1);
    setRotation(0);
    setLoading(true);
  }, []);

  const previous = useCallback(() => {
    setState((current) => ({
      ...current,
      index: (current.index - 1 + current.images.length) % current.images.length
    }));
    resetImage();
    setLoading(true);
  }, [resetImage]);

  const next = useCallback(() => {
    setState((current) => ({
      ...current,
      index: (current.index + 1) % current.images.length
    }));
    resetImage();
    setLoading(true);
  }, [resetImage]);

  const zoomIn = useCallback(() => setZoom((value) => clamp(value + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((value) => clamp(value - ZOOM_STEP)), []);
  const rotateLeft = useCallback(() => setRotation((value) => value - 90), []);
  const rotateRight = useCallback(() => setRotation((value) => value + 90), []);

  useEffect(() => {
    if (!state.open) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
      if (event.key === "+" || event.key === "=" || event.key === "*") zoomIn();
      if (event.key === "-" || event.key === "_") zoomOut();
      if (event.key.toLowerCase() === "r") rotateRight();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, next, previous, rotateRight, state.open, zoomIn, zoomOut]);

  const value = useMemo(() => ({ openImageViewer, close }), [close, openImageViewer]);

  const onWheel = (event) => {
    if (!state.open) return;
    event.preventDefault();
    setZoom((value) => clamp(value + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
  };

  const onTouchStart = (event) => {
    if (event.touches.length === 2) {
      pinchRef.current = { distance: getTouchDistance(event.touches), zoom };
    }
  };

  const onTouchMove = (event) => {
    if (event.touches.length !== 2 || !pinchRef.current.distance) return;
    event.preventDefault();
    const distance = getTouchDistance(event.touches);
    const ratio = distance / pinchRef.current.distance;
    setZoom(clamp(pinchRef.current.zoom * ratio));
  };

  return (
    <ImageViewerContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {state.open && activeImage ? (
          <motion.div
            className="fixed inset-0 z-[140] flex flex-col bg-black text-white"
            style={{ touchAction: "none" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
          >
            <div className="border-b border-white/10 bg-black/95 px-3 py-3 backdrop-blur md:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-nav text-xs font-extrabold uppercase tracking-[0.18em] text-captain-bright">
                    {activeImage.title}
                  </div>
                  <div className="font-mono text-xs text-white/45">
                    {state.index + 1} / {state.images.length} | {Math.round(zoom * 100)}% | {((rotation % 360) + 360) % 360}deg
                  </div>
                </div>
                <IconButton label="Close" onClick={close} icon={X} />
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2 md:flex md:items-center md:justify-end md:overflow-x-auto">
                <IconButton label="Zoom out" onClick={zoomOut} icon={Minus} />
                <IconButton label="Zoom in" onClick={zoomIn} icon={Plus} gold />
                <IconButton label="Rotate left" onClick={rotateLeft} icon={RotateCcw} />
                <IconButton label="Rotate right" onClick={rotateRight} icon={RotateCw} />
                <IconButton label="Reset image" onClick={resetImage} icon={Maximize2} />
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              {loading ? (
                <div className="absolute inset-0 z-10 grid place-items-center bg-black/40">
                  <Spinner className="h-9 w-9" />
                </div>
              ) : null}
              {state.images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={previous}
                    className="absolute left-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/70 text-white shadow-gold transition hover:border-captain-gold md:left-6"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/70 text-white shadow-gold transition hover:border-captain-gold md:right-6"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              ) : null}

              <div className="grid h-full w-full place-items-center overflow-hidden p-3 md:p-8">
                <motion.img
                  key={activeImage.id}
                  src={activeImage.url}
                  alt={activeImage.title}
                  loading="eager"
                  decoding="async"
                  draggable="false"
                  onLoad={() => setLoading(false)}
                  onError={() => setLoading(false)}
                  className="max-h-full max-w-full select-none rounded-lg object-contain shadow-gold-strong"
                  animate={{ scale: zoom, rotate: rotation }}
                  transition={{ type: "spring", stiffness: 180, damping: 24 }}
                  style={{
                    transformOrigin: "center center",
                    imageRendering: "auto",
                    willChange: "transform"
                  }}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ImageViewerContext.Provider>
  );
}

function IconButton({ label, onClick, icon: Icon, gold = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-10 w-full min-w-10 shrink-0 place-items-center rounded-lg border transition md:w-10 ${
        gold
          ? "border-captain-gold bg-captain-gold text-captain-black"
          : "border-white/15 bg-white/5 text-white hover:border-captain-gold hover:text-captain-bright"
      }`}
    >
      <Icon size={18} />
    </button>
  );
}

export function useImageViewer() {
  const context = useContext(ImageViewerContext);
  if (!context) {
    throw new Error("useImageViewer must be used inside ImageViewerProvider");
  }
  return context;
}
