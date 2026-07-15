import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Текст не указан" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY не задан на сервере" },
        { status: 500 },
      );
    } // Используем актуальную модель для генерации TTS

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Say clearly in a professional British English accent: ${text}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        return NextResponse.json(
          {
            error:
              "Превышен лимит запросов к API. Пожалуйста, подождите минуту.",
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        {
          error:
            errorData?.error?.message ||
            `Ошибка сервера Google: ${response.status}`,
        },
        { status: response.status },
      );
    }

    const result = await response.json();
    const base64Audio =
      result?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return NextResponse.json(
        { error: "Не удалось получить аудиоданные от модели." },
        { status: 500 },
      );
    } // Возвращаем base64 фронтенду

    return NextResponse.json({ base64Audio });
  } catch (error: any) {
    console.error("🔴 [TTS Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Внутренняя ошибка сервера озвучки" },
      { status: 500 },
    );
  }
}
