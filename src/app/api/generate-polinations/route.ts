import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";

// Замени переменную в .env на HF_TOKEN (берется в настройках Hugging Face -> Access Tokens)
const HF_TOKEN = process.env.HF_TOKEN;

// Инициализируем клиент Hugging Face один раз (только если токен есть)
const client = HF_TOKEN ? new InferenceClient(HF_TOKEN) : null;

async function generateImage(promptForFlux: string) {
  // Формируем твой красивый промпт для карточек
  const prompt = `A single isolated 2D flat vector illustration for this example "${promptForFlux}" for kids, cute minimalist design, thick clean outlines, clean white background`;
  
  try {
    // Pollinations принимает промпт прямо в URL. Кодируем строку, чтобы пробелы не сломали ссылку.
    // Параметр nologo=true убирает вотермарку, а &flux=true заставляет использовать Flux
    const url = `https://image.pollinations.ai/p/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&flux=true`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("🔴 Ошибка Pollinations API. Статус:", response.status);
      return null;
    }

    // Читаем бинарный поток картинки
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    return base64Data || null;
  } catch (error) {
    console.error("🔴 Исключение при генерации картинки на Pollinations:", error);
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
