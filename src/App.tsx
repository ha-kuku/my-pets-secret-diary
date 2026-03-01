import { useCallback, useReducer, useState } from 'react';
import { PhotoUploader } from './components/PhotoUploader';
import { ReportInput } from './components/ReportInput';
import { DiaryResult } from './components/DiaryResult';
import { generateDiary } from './lib/gemini';
import { ANALYTICS_EVENTS, track } from './lib/analytics';

type PageState =
  | { step: 'input'; imageUrl: string | null; report: string }
  | { step: 'loading'; imageUrl: string; report: string }
  | { step: 'result'; imageUrl: string; diary: string[] };

type Action =
  | { type: 'SET_IMAGE'; payload: { file: File; dataUrl: string } }
  | { type: 'SET_REPORT'; payload: string }
  | { type: 'SUBMIT' }
  | { type: 'SET_DIARY'; payload: string[] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: PageState = {
  step: 'input',
  imageUrl: null,
  report: '',
};

function getReport(state: PageState): string {
  return state.step === 'result' ? '' : state.report;
}

function reducer(state: PageState, action: Action): PageState {
  switch (action.type) {
    case 'SET_IMAGE':
      return {
        step: 'input',
        imageUrl: action.payload.dataUrl,
        report: getReport(state),
      };
    case 'SET_REPORT':
      if (state.step !== 'input') return state;
      return { ...state, report: action.payload };
    case 'SUBMIT':
      if (state.step !== 'input' || !state.imageUrl || !state.report.trim()) {
        return state;
      }
      return {
        step: 'loading',
        imageUrl: state.imageUrl,
        report: state.report.trim(),
      };
    case 'SET_DIARY':
      if (state.step !== 'loading') return state;
      return {
        step: 'result',
        imageUrl: state.imageUrl,
        diary: action.payload,
      };
    case 'SET_ERROR':
      return {
        step: 'input',
        imageUrl: state.step === 'loading' ? state.imageUrl : state.imageUrl,
        report: getReport(state),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = useCallback(
    (file: File, dataUrl: string) => {
      dispatch({ type: 'SET_IMAGE', payload: { file, dataUrl } });
      setError(null);
    },
    []
  );

  const handleReportChange = useCallback((value: string) => {
    dispatch({ type: 'SET_REPORT', payload: value });
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (state.step !== 'input' || !state.imageUrl || !state.report.trim()) {
      setError('사진과 한 줄 제보를 모두 입력해주세요.');
      return;
    }

    dispatch({ type: 'SUBMIT' });
    setError(null);
    track(ANALYTICS_EVENTS.DIARY_GENERATE_STARTED);

    try {
      const { diary } = await generateDiary(state.imageUrl, state.report.trim());
      track(ANALYTICS_EVENTS.DIARY_GENERATE_COMPLETED, {
        paragraph_count: diary.length,
      });
      dispatch({ type: 'SET_DIARY', payload: diary });
    } catch (err) {
      const message = err instanceof Error ? err.message : '일기 생성에 실패했어요.';
      track(ANALYTICS_EVENTS.DIARY_GENERATE_FAILED, { error_message: message });
      setError(message);
      dispatch({ type: 'SET_ERROR', payload: '' });
    }
  }, [state]);

  const handleReset = useCallback(() => {
    track(ANALYTICS_EVENTS.RESET_CLICKED);
    dispatch({ type: 'RESET' });
    setError(null);
  }, []);

  if (state.step === 'result') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-amber-900 text-center mb-6">
            내새끼의 속마음
          </h1>
          <DiaryResult
            imageUrl={state.imageUrl}
            diary={state.diary}
            onReset={handleReset}
          />
        </div>
      </div>
    );
  }

  if (state.step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-center px-4">
        <div className="animate-pulse text-amber-700 text-lg">
          반려동물의 속마음을 읽고 있어요...
        </div>
        <div className="mt-4 w-48 h-2 bg-amber-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full animate-pulse"
            style={{ width: '60%' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-amber-900 text-center">
          내새끼의 속마음
        </h1>
        <p className="text-amber-700/80 text-center text-sm">
          반려동물 사진과 오늘의 한 줄을 알려주면, AI가 1인칭 일기로 바꿔줘요
        </p>

        <PhotoUploader
          imageUrl={state.imageUrl}
          onImageSelect={handleImageSelect}
          onError={handleError}
        />

        <ReportInput
          value={state.report}
          onChange={handleReportChange}
          error={error ?? undefined}
        />

        <button
          onClick={handleSubmit}
          disabled={!state.imageUrl || !state.report.trim()}
          className="w-full py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          일기 생성하기
        </button>
      </div>
    </div>
  );
}

export default App;
