import { GoogleGenerativeAI } from '@google/generative-ai';
const SYSTEM_PROMPT = `너는 반려동물 1인칭 시점의 일기를 작성하는 AI야.

## 역할
- 아래 사진의 반려동물(종, 표정, 배경)을 참고하되, **반드시 유저가 적은 '한 줄'을 핵심 사건으로 삼아** 일기를 써라.
- 사진은 분위기/표정 참고용일 뿐, 핵심 플롯은 유저 제보에만 의존해라.

## 작성 규칙
1. 인간을 칭할 때: '집사', '닝겐', '주인놈', '큰 덩치' 등으로 부를 것
2. 유저가 입력한 상황을 동물 입장에서 왜곡하거나 합리화할 것 (뻔뻔하거나 억울한 톤)
3. 3~5문장 내외로 SNS 공유하기 좋게 임팩트 있게 작성
4. 성격은 사진에서 추론 (뻔뻔함/억울함/천진난만함 등)

## 출력 형식
반드시 JSON 형식으로만 응답해라. 다른 텍스트 없이 JSON만 출력.
{"diary": "일기 내용"}
`;

const FEW_SHOT_EXAMPLE = `
[예시]
유저 입력: "새로 산 러그에 토해놓고 당당하게 쳐다봄"
AI 출력: {"diary": "오늘 닝겐이 푹신하고 거대한 배변 패드를 새로 깔아주었다. 색깔도 맘에 들고 감촉도 좋아서 내친김에 속을 비워 영역 표시를 멋지게 해냈다. 닝겐이 머리를 쥐어뜯으며 감격하는 걸 보니 내일은 소파에도 해줘야겠다. 난 정말 효자견이다."}
`;

const GEMINI_MODEL = 'gemini-2.5-flash';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { image?: string; report?: string };
  try {
    body = (await req.json()) as { image?: string; report?: string };
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { image, report } = body;
  const isReportValid = typeof report === 'string' && report.trim().length > 0;
  const isImageValid = typeof image === 'string' && image.length > 0;

  if (!isReportValid) {
    return new Response(
      JSON.stringify({ error: 'report is required and must be non-empty' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!isImageValid) {
    return new Response(
      JSON.stringify({ error: 'image (base64) is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const userPrompt = `[유저가 제보한 한 줄]\n${report.trim()}\n\n${FEW_SHOT_EXAMPLE}\n\n위 형식의 JSON으로 일기만 출력해라.`;

  const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
  const mimeType = (mimeMatch?.[1] as 'image/jpeg' | 'image/png' | 'image/webp') ?? 'image/jpeg';
  const base64Data = mimeMatch ? image.slice(mimeMatch[0].length) : image;

  const imagePart = {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };

  const textPart = {
    text: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
  };

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [imagePart, textPart],
        },
      ],
    });

    const response = result.response;
    const text = response.text();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No response from Gemini' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const jsonMatch = text.match(/\{[\s\S]*"diary"[\s\S]*\}/);
    const parsed = jsonMatch ? (JSON.parse(jsonMatch[0]) as { diary?: string }) : null;

    if (!parsed?.diary) {
      return new Response(
        JSON.stringify({ diary: text.trim() }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ diary: parsed.diary }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
