import { useCallback, useEffect, useRef, useState } from 'react';
import { composePolaroid, blobToBase64 } from '../lib/composeCanvas';
import { uploadPolaroid } from '../lib/gemini';
import { ShareButtons } from './ShareButtons';

type DiaryResultProps = {
  imageUrl: string;
  diary: string;
  onReset: () => void;
};

const LOADING_MESSAGES = [
  '반려동물의 속마음을 읽고 있어요...',
  '일기 쓰는 중...',
  '거의 다 됐어요!',
];

export function DiaryResult({
  imageUrl,
  diary,
  onReset,
}: DiaryResultProps) {
  const [polaroidBlob, setPolaroidBlob] = useState<Blob | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const canvasInitialized = useRef(false);

  useEffect(() => {
    if (canvasInitialized.current) return;
    canvasInitialized.current = true;

    composePolaroid(imageUrl, diary)
      .then(setPolaroidBlob)
      .catch((err) => {
        setUploadError(err instanceof Error ? err.message : '이미지 생성 실패');
      });
  }, [imageUrl, diary]);

  const handleDownload = useCallback(() => {
    if (!polaroidBlob) return;
    const url = URL.createObjectURL(polaroidBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `내새끼의-속마음-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [polaroidBlob]);

  const handleShareUrl = useCallback(async () => {
    if (!polaroidBlob) return;
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      return;
    }

    setUploadError(null);
    try {
      const base64 = await blobToBase64(polaroidBlob);
      const { shareUrl: url } = await uploadPolaroid(base64);
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '업로드 실패');
    }
  }, [polaroidBlob, shareUrl]);

  const [polaroidUrl, setPolaroidUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!polaroidBlob) {
      setPolaroidUrl(null);
      return;
    }
    const url = URL.createObjectURL(polaroidBlob);
    setPolaroidUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [polaroidBlob]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="rounded-2xl overflow-hidden shadow-xl bg-amber-50/80 p-4">
        {polaroidUrl ? (
          <img
            src={polaroidUrl}
            alt="생성된 폴라로이드 일기"
            className="block max-w-full h-auto"
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[320px] gap-2 text-amber-700">
            <span className="animate-pulse">
              {LOADING_MESSAGES[0]}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={handleDownload}
          disabled={!polaroidBlob}
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          다운로드
        </button>
        <button
          onClick={handleShareUrl}
          disabled={!polaroidBlob}
          className="px-5 py-2.5 rounded-xl bg-amber-100 text-amber-800 font-medium hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {shareUrl ? '링크 복사됨' : '공유 링크 생성'}
        </button>
        <ShareButtons
          polaroidBlob={polaroidBlob}
          shareUrl={shareUrl}
        />
        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded-xl border-2 border-amber-300 text-amber-700 font-medium hover:bg-amber-50 transition-colors"
        >
          다시 만들기
        </button>
      </div>

      {uploadError && (
        <p className="text-red-600 text-sm">{uploadError}</p>
      )}
    </div>
  );
}
