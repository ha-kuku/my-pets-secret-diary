import { useCallback, useState } from 'react';
import { resizeImageForApi } from '../lib/resizeImage';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

function validateImageFile(file: File): ValidationResult {
  const isAcceptedType = ACCEPTED_IMAGE_TYPES.includes(file.type);
  if (!isAcceptedType) {
    return { ok: false, reason: 'JPEG, PNG, WebP 형식만 업로드 가능해요.' };
  }

  const isWithinSizeLimit = file.size <= MAX_FILE_SIZE_BYTES;
  if (!isWithinSizeLimit) {
    return { ok: false, reason: '파일 크기는 5MB 이하여야 해요.' };
  }

  return { ok: true };
}

type PhotoUploaderProps = {
  imageUrl: string | null;
  onImageSelect: (file: File, dataUrl: string) => void;
  onError: (message: string) => void;
};

export function PhotoUploader({
  imageUrl,
  onImageSelect,
  onError,
}: PhotoUploaderProps) {
  const [isResizing, setIsResizing] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validation = validateImageFile(file);
      if (!validation.ok) {
        onError(validation.reason);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setIsResizing(true);
        try {
          const resizedDataUrl = await resizeImageForApi(dataUrl);
          onImageSelect(file, resizedDataUrl);
        } catch {
          onError('이미지 처리에 실패했어요.');
        } finally {
          setIsResizing(false);
        }
      };
      reader.onerror = () => onError('이미지를 읽을 수 없어요.');
      reader.readAsDataURL(file);
    },
    [onImageSelect, onError]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      const validation = validateImageFile(file);
      if (!validation.ok) {
        onError(validation.reason);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setIsResizing(true);
        try {
          const resizedDataUrl = await resizeImageForApi(dataUrl);
          onImageSelect(file, resizedDataUrl);
        } catch {
          onError('이미지 처리에 실패했어요.');
        } finally {
          setIsResizing(false);
        }
      };
      reader.onerror = () => onError('이미지를 읽을 수 없어요.');
      reader.readAsDataURL(file);
    },
    [onImageSelect, onError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const isImageSelected = imageUrl !== null;

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl transition-colors
        ${isImageSelected ? 'border-amber-200 bg-amber-50/50' : 'border-amber-300 bg-amber-50/30 hover:border-amber-400'}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <label className="flex flex-col items-center justify-center min-h-[240px] cursor-pointer p-6">
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleFileChange}
          className="sr-only"
        />
        {isResizing ? (
          <div className="flex flex-col items-center gap-2 text-amber-700">
            <span className="animate-pulse">이미지 최적화 중...</span>
          </div>
        ) : isImageSelected ? (
          <img
            src={imageUrl}
            alt="업로드된 반려동물 사진"
            className="max-h-64 object-cover rounded-lg shadow-md"
          />
        ) : (
          <>
            <span className="text-4xl mb-2">📷</span>
            <span className="text-amber-800 font-medium">
              사진을 드래그하거나 클릭해서 업로드
            </span>
            <span className="text-amber-600/80 text-sm mt-1">
              JPEG, PNG, WebP (최대 5MB)
            </span>
          </>
        )}
      </label>
    </div>
  );
}
