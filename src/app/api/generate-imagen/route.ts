import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function generateImage(promptForFlux: string) {
  // const prompt = `A clean clear vector educational illustration of '${word}' (${translation}) for kids, white background, minimalist style`;
    // Формируем чистый и строгий промпт с фокусом на типографику и смысл
  const prompt = `A single isolated 2D vector illustration for this example "${promptForFlux}" for kids, cute minimalist design, thick clean outlines, clean white background`;
  
  
  // ⚡️ Переключаемся на бесплатную и стабильную модель Nano Banana 2
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;


  // const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
      
  //     const payload = {
  //       instances: [{ prompt: prompt }],
  //       parameters: { sampleCount: 1 }
  //     };

  console.log("Imagen")

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("🔴 Ошибка Nano Banana API. Статус:", response.status);
      console.error("🔴 Детали:", errText);
      return null;
    }

    const result = await response.json();
    
    // Вытаскиваем base64 из нативного формата генерации медиафайлов Google
    const base64Data = result?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    return base64Data || null;
  } catch (error) {
    console.error("🔴 Исключение при генерации картинки:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const {promptForFlux } = await req.json();

    if (!promptForFlux) {
      return NextResponse.json({ error: "Не передано слово или перевод" }, { status: 400 });
    }

    const imageBase64 = await generateImage(promptForFlux);

    return NextResponse.json({ imageBase64 });
  } catch (error: any) {
    console.error("🔴 [Image Route Error]:", error);
    return NextResponse.json({ error: error.message || "Ошибка сервера" }, { status: 500 });
  }
}