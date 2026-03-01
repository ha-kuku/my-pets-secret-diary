const POLAROID_PADDING_PX = 24;
const POLAROID_PHOTO_HEIGHT_PX = 320;
const DIARY_FONT_SIZE_PX = 16;
const DIARY_LINE_HEIGHT_PX = 24;
const DIARY_PADDING_PX = 20;
const MAX_DIARY_WIDTH_PX = 320;

export async function composePolaroid(
  imageUrl: string,
  diaryText: string
): Promise<Blob> {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');

  const photoWidth = POLAROID_PHOTO_HEIGHT_PX;
  const photoHeight = POLAROID_PHOTO_HEIGHT_PX;

  const diaryLines = wrapText(diaryText, MAX_DIARY_WIDTH_PX, DIARY_FONT_SIZE_PX);
  const diaryHeight = diaryLines.length * DIARY_LINE_HEIGHT_PX + DIARY_PADDING_PX * 2;

  const canvasWidth = photoWidth + POLAROID_PADDING_PX * 2;
  const canvasHeight = photoHeight + diaryHeight + POLAROID_PADDING_PX * 2;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(
    POLAROID_PADDING_PX,
    POLAROID_PADDING_PX,
    photoWidth,
    photoHeight + diaryHeight
  );

  const sourceRect = getCoverCropRect(
    image.width,
    image.height,
    photoWidth,
    photoHeight
  );
  ctx.drawImage(
    image,
    sourceRect.sx,
    sourceRect.sy,
    sourceRect.sw,
    sourceRect.sh,
    POLAROID_PADDING_PX,
    POLAROID_PADDING_PX,
    photoWidth,
    photoHeight
  );

  ctx.fillStyle = '#2c2419';
  ctx.font = `${DIARY_FONT_SIZE_PX}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'left';

  const diaryY = POLAROID_PADDING_PX + photoHeight + DIARY_PADDING_PX;
  diaryLines.forEach((line, i) => {
    ctx.fillText(
      line,
      POLAROID_PADDING_PX + DIARY_PADDING_PX,
      diaryY + DIARY_PADDING_PX + (i + 1) * DIARY_LINE_HEIGHT_PX
    );
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
      'image/png',
      0.95
    );
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

function getCoverCropRect(
  imgW: number,
  imgH: number,
  targetW: number,
  targetH: number
): { sx: number; sy: number; sw: number; sh: number } {
  const imgRatio = imgW / imgH;
  const targetRatio = targetW / targetH;

  let sw: number;
  let sh: number;
  let sx: number;
  let sy: number;

  if (imgRatio > targetRatio) {
    sh = imgH;
    sw = imgH * targetRatio;
    sx = (imgW - sw) / 2;
    sy = 0;
  } else {
    sw = imgW;
    sh = imgW / targetRatio;
    sx = 0;
    sy = (imgH - sh) / 2;
  }

  return { sx, sy, sw, sh };
}

function wrapText(
  text: string,
  maxWidthPx: number,
  fontSizePx: number
): string[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [text];

  ctx.font = `${fontSizePx}px "Noto Sans KR", sans-serif`;
  const words = text.split('');
  const lines: string[] = [];
  let currentLine = '';

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidthPx && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64 ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
