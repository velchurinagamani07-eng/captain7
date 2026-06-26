import { useEffect } from "react";
import { useImageViewer } from "../../context/ImageViewerContext.jsx";

export function Lightbox({ images, selected, onClose, onSelect }) {
  const { openImageViewer } = useImageViewer();

  useEffect(() => {
    if (!selected) return;
    openImageViewer({
      images,
      index: images.findIndex((image) => image.id === selected.id)
    });
    onClose?.();
  }, [images, onClose, openImageViewer, selected]);

  return null;
}
