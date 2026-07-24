import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function translateAndDescribeWord(word: string) {
  // Расширяем промпт, заставляя Gemini придумать простую физическую ассоциацию для картинок
  // const prompt = `You are a UI designer for a language learning app. Analyze the English word or phrase "${word}".
  // Provide a JSON object with strictly these three keys:
  // 1. "translation": The most popular Russian translation (1-3 words, no explanations).
  // 2. "example": A short, natural, simple context sentence using this word in English.
  // 3. "visualPrompt": Give me simpl explanation the meaning of this word (especially if it is abstract). Avoid abstract ideas, describe a clear scene with shapes or items. Do not include words like "sticker" or "vector", just describe the object itself in 3-7 words.

  // Example output for abstract word "friction":
  // {"translation": "Трение", "example": "Friction creates heat.", "visualPrompt": "two hands rubbing together with small sparks"}

  // Example output for concrete word "apple":
  // {"translation": "Яблоко", "example": "He ate a red apple.", "visualPrompt": "a single fresh red apple with a leaf"}`;

  const prompt = `You are a UI designer for a language learning app. Analyze the English word or phrase "${word}".
  Provide a JSON object with strictly these three keys:
  1. "translation": The most popular Russian translation (1-3 words, no explanations).
  2. "example": A short, natural, simple context sentence using this word in English.
  3. "visualPrompt": Give me simpl explanation the meaning of this word (especially if it is abstract). Avoid abstract ideas, describe a clear scene with shapes or items.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    console.error("🔴 ГЕМИНИ РУГАЕТСЯ. Статус:", response.status);
    throw new Error(`Gemini API failed with status ${response.status}`);
  }

  const result = await response.json();
  const textResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  return textResponse ? JSON.parse(textResponse) : null;
}

export async function POST(req: Request) {
  try {
    const { word } = await req.json();

    if (!word?.trim()) {
      return NextResponse.json({ error: "Слово не указано" }, { status: 400 });
    }

    const aiData = await translateAndDescribeWord(word);

    if (!aiData) {
      return NextResponse.json({ error: "Не удалось распарсить ответ ИИ" }, { status: 500 });
    }

    // Возвращаем фронтенду перевод, пример И готовое описание для генератора картинок
    return NextResponse.json({
      translation: aiData.translation,
      example: aiData.example,
      visualPrompt: aiData.visualPrompt, // <-- передаем дальше
    });
  } catch (error: any) {
    console.error("🔴 [Translate Route Error]:", error);
    return NextResponse.json({ error: error.message || "Ошибка сервера" }, { status: 500 });
  }
}