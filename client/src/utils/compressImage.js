function bytesToFileName(file) {
  return file.name.replace(/\.[^.]+$/, "") + "-compressed.jpg";
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

async function fileToImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImage(file, maxSizeKB = 200, onProgress) {
  const maxBytes = maxSizeKB * 1024;
  const originalSize = file.size;
  const image = await fileToImage(file);
  const scale = Math.min(1, 1920 / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);

  let low = 0.35;
  let high = 0.92;
  let bestBlob = await canvasToBlob(canvas, high);

  for (let i = 0; i < 8; i += 1) {
    const quality = (low + high) / 2;
    const blob = await canvasToBlob(canvas, quality);
    onProgress?.(Math.round(((i + 1) / 8) * 100));
    if (blob.size <= maxBytes) {
      bestBlob = blob;
      low = quality;
    } else {
      high = quality;
    }
  }

  if (bestBlob.size > maxBytes) {
    bestBlob = await canvasToBlob(canvas, 0.25);
  }

  const compressed = new File([bestBlob], bytesToFileName(file), {
    type: "image/jpeg",
    lastModified: Date.now()
  });

  return {
    file: compressed,
    originalSize,
    compressedSize: compressed.size,
    compressionRatio: originalSize ? Math.round((1 - compressed.size / originalSize) * 100) : 0
  };
}
