# 내새끼의 속마음 (My Pet's Secret Diary)

반려동물 사진과 보호자의 한 줄 제보를 결합해, AI가 1인칭 시점의 과몰입 일기를 자동 생성하는 엔터테인먼트 서비스입니다.

## 기술 스택

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **AI**: Google Gemini 2.5 Flash (이미지 + 텍스트 멀티모달)
- **스토리지**: Cloudflare R2 (공유 링크용)
- **배포**: Vercel (정적 사이트 + 서버리스 함수)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 참고해 `.env.local` 파일을 생성하세요.

```bash
# 필수: Gemini API 키 (Google AI Studio에서 발급)
GEMINI_API_KEY=your_gemini_api_key

# 선택: R2 공유 링크 (설정 시 공유 링크 생성 가능)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

### 3. 로컬 개발

**프론트엔드만 실행** (API 없이 UI 확인):

```bash
npm run dev
```

**전체 스택 실행** (API 포함, Vercel CLI 필요):

```bash
npx vercel dev
```

### 4. 빌드 및 배포

```bash
npm run build
```

Vercel에 배포 시 `vercel` 명령어 또는 GitHub 연동을 사용하세요.

## 프로젝트 구조

```
src/
├── components/     # PhotoUploader, ReportInput, DiaryResult, ShareButtons
├── lib/           # gemini (API 호출), composeCanvas (폴라로이드 합성), prompts
└── types/
api/               # Vercel 서버리스 함수
├── generate.ts    # Gemini 2.5 Flash 일기 생성
└── upload.ts      # R2 폴라로이드 업로드
```

## 사용 방법

1. 반려동물 사진 1장 업로드
2. "오늘 이 녀석이 친 사고나 있었던 일 딱 한 줄" 입력
3. AI가 생성한 1인칭 일기를 폴라로이드 형태로 확인
4. 다운로드 또는 SNS 공유
