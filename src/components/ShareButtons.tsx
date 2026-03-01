import { useCallback } from 'react';

const TWITTER_SHARE_BASE = 'https://twitter.com/intent/tweet';
const SERVICE_NAME = '내새끼의 속마음';

type ShareButtonsProps = {
  polaroidBlob: Blob | null;
  shareUrl: string | null;
};

export function ShareButtons({
  polaroidBlob,
  shareUrl,
}: ShareButtonsProps) {
  const handleWebShare = useCallback(async () => {
    if (!polaroidBlob) return;

    const file = new File(
      [polaroidBlob],
      `내새끼의-속마음-${Date.now()}.png`,
      { type: 'image/png' }
    );

    const canShare = navigator.canShare?.({ files: [file] }) ?? false;
    if (!canShare) {
      const twitterUrl = shareUrl
        ? `${TWITTER_SHARE_BASE}?text=${encodeURIComponent(SERVICE_NAME)}&url=${encodeURIComponent(shareUrl)}`
        : `${TWITTER_SHARE_BASE}?text=${encodeURIComponent(SERVICE_NAME)}`;
      window.open(twitterUrl, '_blank');
      return;
    }

    try {
      await navigator.share({
        title: SERVICE_NAME,
        text: '우리 반려동물의 비밀 일기를 확인해보세요!',
        files: [file],
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }, [polaroidBlob, shareUrl]);

  const handleTwitterShare = useCallback(() => {
    const text = shareUrl
      ? `${SERVICE_NAME} - 우리 반려동물의 비밀 일기`
      : SERVICE_NAME;
    const url = shareUrl
      ? `${TWITTER_SHARE_BASE}?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
      : `${TWITTER_SHARE_BASE}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [shareUrl]);

  const isDisabled = !polaroidBlob;

  return (
    <>
      <button
        onClick={handleWebShare}
        disabled={isDisabled}
        className="px-5 py-2.5 rounded-xl bg-sky-100 text-sky-800 font-medium hover:bg-sky-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        공유하기
      </button>
      <button
        onClick={handleTwitterShare}
        disabled={isDisabled}
        className="px-5 py-2.5 rounded-xl bg-[#1DA1F2]/10 text-[#1DA1F2] font-medium hover:bg-[#1DA1F2]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        X에 공유
      </button>
    </>
  );
}
