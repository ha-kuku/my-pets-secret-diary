import { type AnalyticsEventName, type AnalyticsEventParams } from './schema';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;
const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;

let isInitialized = false;

export function initAnalytics(): void {
  if (isInitialized) return;
  isInitialized = true;

  if (GA4_MEASUREMENT_ID) {
    loadGA4(GA4_MEASUREMENT_ID);
  }

  if (CLARITY_PROJECT_ID) {
    loadClarity(CLARITY_PROJECT_ID);
  }
}

function loadGA4(measurementId: string): void {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

function loadClarity(projectId: string): void {
  // 공식 Clarity 스니펫: clarity.q에 큐를 두고, 스크립트 로드 전 호출을 큐잉
  (function (c: Window, l: Document, a: string, i: string) {
    const w = c as unknown as Record<string, unknown>;
    w[a] =
      w[a] ||
      function (...args: unknown[]) {
        ((w[a] as { q?: unknown[] }).q = (w[a] as { q?: unknown[] }).q || []).push(args);
      };
    const t = l.createElement('script');
    t.async = true;
    t.src = 'https://www.clarity.ms/tag/' + i;
    const y = l.getElementsByTagName('script')[0];
    y.parentNode?.insertBefore(t, y);
  })(window, document, 'clarity', projectId);
}

export function track<E extends AnalyticsEventName>(eventName: E, params?: AnalyticsEventParams[E]): void {
  const safeParams = params ?? {};

  if (window.gtag && GA4_MEASUREMENT_ID) {
    window.gtag('event', eventName, safeParams);
  }

  if (window.clarity) {
    window.clarity('event', eventName);
  }
}
