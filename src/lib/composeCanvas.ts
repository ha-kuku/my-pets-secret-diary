const POLAROID_PADDING_PX = 24;
const POLAROID_PHOTO_HEIGHT_PX = 320;
const DIARY_FONT_SIZE_PX = 16;
const DIARY_LINE_HEIGHT_PX = 24;
const DIARY_PADDING_PX = 20;
const DIARY_GAP_FROM_PHOTO_PX = 8;
const PHOTO_WIDTH_PX = POLAROID_PHOTO_HEIGHT_PX;
const MAX_DIARY_WIDTH_PX = PHOTO_WIDTH_PX - DIARY_PADDING_PX * 2;
const MAX_DIARY_LINES = 8;

const PARAGRAPH_GAP_PX = 8;

function buildDiaryLines(
  paragraphs: string[],
  maxWidthPx: number,
  maxLines: number
): { lines: string[]; fontSize: number; lineHeight: number } {
  let fontSize = DIARY_FONT_SIZE_PX;
  let lineHeight = DIARY_LINE_HEIGHT_PX;

  const flattenWithParagraphGaps = (paraList: string[]): string[] => {
    const result: string[] = [];
    paraList.forEach((para, i) => {
      const wrapped = wrapText(para, maxWidthPx, fontSize);
      result.push(...wrapped);
      if (i < paraList.length - 1) result.push('');
    });
    return result;
  };

  let lines = flattenWithParagraphGaps(paragraphs);

  if (lines.length > maxLines) {
    fontSize = 14;
    lineHeight = 22;
    lines = flattenWithParagraphGaps(paragraphs);
  }
  if (lines.length > maxLines) {
    fontSize = 12;
    lineHeight = 20;
    lines = flattenWithParagraphGaps(paragraphs);
  }
  if (lines.length > maxLines) {
    const flat = lines.filter((l) => l !== '');
    lines = flat.slice(0, maxLines);
  }

  return { lines, fontSize, lineHeight };
}

export async function composePolaroid(
  imageUrl: string,
  diaryParagraphs: string[]
): Promise<Blob> {
  const image = await loadImage(imageUrl);
  try {
    await document.fonts.load(`${DIARY_FONT_SIZE_PX}px "Noto Sans KR"`);
  } catch {
    // Font load 실패 시 기본 폰트 사용
  }

  const canvas = document.createElement('canvas');
  const photoWidth = PHOTO_WIDTH_PX;
  const photoHeight = POLAROID_PHOTO_HEIGHT_PX;

  let { lines: diaryLines, fontSize, lineHeight } = buildDiaryLines(
    diaryParagraphs,
    MAX_DIARY_WIDTH_PX,
    MAX_DIARY_LINES
  );

  const lineCount = diaryLines.length;
  const paragraphGapCount = diaryLines.filter((l) => l === '').length;
  const diaryHeight =
    DIARY_GAP_FROM_PHOTO_PX +
    lineCount * lineHeight +
    paragraphGapCount * PARAGRAPH_GAP_PX +
    DIARY_PADDING_PX * 2;

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

  const diaryAreaX = POLAROID_PADDING_PX + DIARY_PADDING_PX;
  const diaryAreaY =
    POLAROID_PADDING_PX + photoHeight + DIARY_GAP_FROM_PHOTO_PX;

  ctx.save();
  ctx.beginPath();
  ctx.rect(
    POLAROID_PADDING_PX,
    POLAROID_PADDING_PX + photoHeight,
    photoWidth,
    diaryHeight
  );
  ctx.clip();

  ctx.fillStyle = '#2c2419';
  ctx.font = `${fontSize}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'left';

  let yOffset = 0;
  diaryLines.forEach((line) => {
    yOffset += lineHeight;
    if (line !== '') {
      ctx.fillText(line, diaryAreaX, diaryAreaY + yOffset);
    } else {
      yOffset += PARAGRAPH_GAP_PX;
    }
  });

  ctx.restore();

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
