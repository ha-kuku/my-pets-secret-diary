/**
 * 분석 이벤트 스키마
 * 의미 있는 사용자 행동만 수집
 */
export const ANALYTICS_EVENTS = {
  /** 사진 업로드 완료 */
  PHOTO_UPLOADED: 'photo_uploaded',
  /** 일기 생성 요청 */
  DIARY_GENERATE_STARTED: 'diary_generate_started',
  /** 일기 생성 성공 */
  DIARY_GENERATE_COMPLETED: 'diary_generate_completed',
  /** 일기 생성 실패 */
  DIARY_GENERATE_FAILED: 'diary_generate_failed',
  /** 폴라로이드 다운로드 */
  POLAROID_DOWNLOADED: 'polaroid_downloaded',
  /** 공유 링크 생성 */
  SHARE_LINK_GENERATED: 'share_link_generated',
  /** 공유 버튼 클릭 (플랫폼별) */
  SHARE_CLICKED: 'share_clicked',
  /** 다시 만들기 */
  RESET_CLICKED: 'reset_clicked',
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsEventParams = {
  [ANALYTICS_EVENTS.PHOTO_UPLOADED]: { file_type: string };
  [ANALYTICS_EVENTS.DIARY_GENERATE_STARTED]: Record<string, never>;
  [ANALYTICS_EVENTS.DIARY_GENERATE_COMPLETED]: { paragraph_count: number };
  [ANALYTICS_EVENTS.DIARY_GENERATE_FAILED]: { error_message: string };
  [ANALYTICS_EVENTS.POLAROID_DOWNLOADED]: Record<string, never>;
  [ANALYTICS_EVENTS.SHARE_LINK_GENERATED]: Record<string, never>;
  [ANALYTICS_EVENTS.SHARE_CLICKED]: { platform: 'web_share' | 'twitter' };
  [ANALYTICS_EVENTS.RESET_CLICKED]: Record<string, never>;
};
