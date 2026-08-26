import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";

const HF_TOKEN = process.env.HF_TOKEN;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",");

const client = HF_TOKEN ? new InferenceClient(HF_TOKEN) : null;

// Провайдер 1: Hugging Face (FLUX.1-schnell) — только для вас
async function generateViaHuggingFace(promptForFlux: string) {
  if (!client) return null;

  const prompt = `A single isolated 2D flat vector illustration for this example "${promptForFlux}" for kids, cute minimalist design, thick clean outlines, clean white background`;

  try {
    const imageBlob = (await client.textToImage({
      provider: "nscale",
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: prompt,
      parameters: { num_inference_steps: 4 },
    })) as unknown as Blob;

    const arrayBuffer = await imageBlob.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (error) {
    console.error("🔴 [HF Error]:", error);
    return null;
  }
}

// Провайдер 2: Pollinations.ai — для обычных пользователей
async function generateViaPollinations(promptForFlux: string) {
  try {
    const prompt = `Simple flat vector illustration of ${promptForFlux}, cute minimalist design for children, clean white background, vibrant colors, single object centered`;
    // Генерируем случайный seed для избежания кеширования абстракций
    const seed = Math.floor(Math.random() * 1000000);

    const url = `https://image.pollinations.ai/p/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&model=flux&seed=${seed}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (error) {
    console.error("🔴 [Pollinations Error]:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { promptForFlux, userEmail } = await req.json();

    if (!promptForFlux) {
      return NextResponse.json({ error: "Промпт не передан" }, { status: 400 });
    }
    // Проверяем, является ли пользователь администратором
    const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail.trim());

    let base64Data: string | null = null;

    if (isAdmin) {
      console.log(`⚡ Режим PRO (${userEmail}): генерация через Hugging Face`);
      base64Data = await generateViaHuggingFace(promptForFlux);

      // Если у HF закончились кредиты/лимиты, фолбэчимся на Pollinations
      if (!base64Data) {
        console.warn("⚠️ Ошибка HF у админа, переключение на Pollinations");
        base64Data = await generateViaPollinations(promptForFlux);
      }
    } else {
      console.log(
        `🌱 Обычный режим (${userEmail || "гость"}): генерация через Pollinations`,
      );
      base64Data = await generateViaPollinations(promptForFlux);
    }

    if (!base64Data) {
      return NextResponse.json(
        { error: "Не удалось сгенерировать изображение" },
        { status: 500 },
      );
    }

    return NextResponse.json({ imageBase64: base64Data, isProMode: isAdmin });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Ошибка сервера" },
      { status: 500 },
    );
  }
}
