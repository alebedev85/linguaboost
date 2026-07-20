import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";

// Замени переменную в .env на HF_TOKEN (берется в настройках Hugging Face -> Access Tokens)
const HF_TOKEN = process.env.HF_TOKEN;

// Инициализируем клиент Hugging Face один раз (только если токен есть)
const client = HF_TOKEN ? new InferenceClient(HF_TOKEN) : null;

async function generateImage(promptForFlux: string) {
  if (!client) {
    console.error("🔴 Ошибка: Клиент Hugging Face не инициализирован");
    return null;
  }

  // Формируем чистый и строгий промпт с фокусом на типографику и смысл
  const prompt = `A single isolated 2D vector illustration for this example "${promptForFlux}" for kids, cute minimalist design, thick clean outlines, clean white background`;

  try {
    // 🔥 Используем SDK вместо сырого fetch. Он сам знает правильные эндпоинты.
    const imageBlob = (await client.textToImage({
      provider: "nscale",
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: prompt,
      parameters: {
        num_inference_steps: 4,
      },
    })) as unknown as Blob;

    // Переводим Blob в Buffer для кодирования в base64
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    return base64Data || null;
  } catch (error: any) {
    console.error("🔴 Исключение при генерации картинки через SDK HF:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { promptForFlux } = await req.json();

    if (!promptForFlux) {
      return NextResponse.json(
        { error: "Не передано слово или перевод" },
        { status: 400 },
      );
    }

    if (!HF_TOKEN) {
      console.error("🔴 Ошибка: Не задан HF_TOKEN в переменных окружения");
      return NextResponse.json(
        { error: "Конфигурация сервера не завершена" },
        { status: 500 },
      );
    }

    const imageBase64 = await generateImage(promptForFlux);

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Не удалось сгенерировать изображение" },
        { status: 500 },
      );
    }

    // Возвращаем строку base64.
    // На фронтенде во фронтенд-методе ты сможешь вставить её как `src={`data:image/webp;base64,${imageBase64}`}`
    return NextResponse.json({ imageBase64 });
  } catch (error: any) {
    console.error("🔴 [Image Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Ошибка сервера" },
      { status: 500 },
    );
  }
}
