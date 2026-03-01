const MAX_DIMENSION_PX = 512;
const JPEG_QUALITY = 0.85;

export async function resizeImageForApi(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);

  const { width, height } = computeResizedDimensions(img.width, img.height, MAX_DIMENSION_PX);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function computeResizedDimensions(
  origWidth: number,
  origHeight: number,
  maxDimension: number,
): { width: number; height: number } {
  const needsResize = origWidth > maxDimension || origHeight > maxDimension;

  if (!needsResize) {
    return { width: origWidth, height: origHeight };
  }

  const scale = maxDimension / Math.max(origWidth, origHeight);
  return {
    width: Math.round(origWidth * scale),
    height: Math.round(origHeight * scale),
  };
}
