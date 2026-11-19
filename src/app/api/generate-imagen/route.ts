import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

type ImageErrorCode =
  | "BAD_REQUEST"
  | "MISSING_API_KEY"
  | "NETWORK_ERROR"
  | "INVALID_JSON"
  | "QUOTA_EXCEEDED"
  | "BLOCKED_CONTENT"
  | "NO_IMAGE_DATA"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

class ImageRouteError extends Error {
  status: number;
  code: ImageErrorCode;

  constructor(message: string, status: number, code: ImageErrorCode) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function buildIllustrationPrompt(rawPrompt: string): string {
  return `A single isolated 2D flat vector illustration for "${rawPrompt}", cute minimalist educational style, clean thick outlines, solid light background, centered composition, no watermarks`;
}

async function generateWithGeminiImage(
  rawPrompt: string
): Promise<{ imageBase64: string; mimeType: string }> {
  if (!GEMINI_API_KEY) {
    throw new ImageRouteError(
      "Не задан GEMINI_API_KEY в переменных окружения",
      500,
      "MISSING_API_KEY"
    );
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_IMAGE_MODEL
  )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const payload = {
    contents: [
      {
        parts: [{ text: buildIllustrationPrompt(rawPrompt) }],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Неизвестная сетевая ошибка";
    throw new ImageRouteError(
      `Ошибка сети при запросе к Gemini API: ${message}`,
      502,
      "NETWORK_ERROR"
    );
  }

  const rawText = await response.text();

  if (!response.ok) {
    let providerMessage = rawText;
    try {
      const parsedError = JSON.parse(rawText);
      providerMessage = parsedError?.error?.message || rawText;
    } catch {
      // Оставляем исходный текст ответа
    }

    if (response.status === 429) {
      throw new ImageRouteError(
        `Превышен лимит запросов к Gemini API (429): ${providerMessage}`,
        429,
        "QUOTA_EXCEEDED"
      );
    }

    const status =
      response.status === 400 || response.status === 401 || response.status === 403
        ? response.status
        : 502;

    throw new ImageRouteError(
      `Ошибка Gemini API (${response.status}): ${providerMessage}`,
      status,
      "UPSTREAM_ERROR"
    );
  }

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new ImageRouteError(
      "Gemini API вернул некорректный JSON",
      502,
      "INVALID_JSON"
    );
  }

  const promptBlockReason = data?.promptFeedback?.blockReason;
  if (promptBlockReason) {
    throw new ImageRouteError(
      `Промпт заблокирован фильтром безопасности (${promptBlockReason})`,
      422,
      "BLOCKED_CONTENT"
    );
  }

  const candidate = data?.candidates?.[0];
  if (!candidate) {
    throw new ImageRouteError(
      "Модель не вернула вариант ответа (candidates пуст)",
      422,
      "NO_IMAGE_DATA"
    );
  }

  const parts: any[] = Array.isArray(candidate?.content?.parts)
    ? candidate.content.parts
    : [];

  const imagePart = parts.find(
    (part) => typeof part?.inlineData?.data === "string" && part.inlineData.data.length > 0
  );

  if (!imagePart) {
    const finishReason = candidate?.finishReason || "UNKNOWN";
    const textPart = parts.find((part) => typeof part?.text === "string")?.text;

    if (finishReason === "SAFETY" || finishReason === "RECITATION") {
      throw new ImageRouteError(
        `Генерация остановлена по причине: ${finishReason}`,
        422,
        "BLOCKED_CONTENT"
      );
    }

    throw new ImageRouteError(
      textPart
        ? `Модель вернула текст вместо изображения: "${textPart.slice(0, 140)}"`
        : `Изображение не найдено в ответе модели (finishReason: ${finishReason})`,
      422,
      "NO_IMAGE_DATA"
    );
  }

  return {
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const promptForFlux =
      typeof body?.promptForFlux === "string" ? body.promptForFlux.trim() : "";

    if (!promptForFlux) {
      return NextResponse.json(
        {
          error: "Не передан обязательный параметр promptForFlux",
          code: "BAD_REQUEST" satisfies ImageErrorCode,
        },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType } = await generateWithGeminiImage(promptForFlux);

    return NextResponse.json({
      imageBase64,
      mimeType,
      model: GEMINI_IMAGE_MODEL,
    });
  } catch (err: unknown) {
    if (err instanceof ImageRouteError) {
      console.error(`🔴 [${err.code}] (${err.status}): ${err.message}`);
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }

    const message =
      err instanceof Error ? err.message : "Непредвиденная ошибка сервера";
    console.error("🔴 [INTERNAL_ERROR] (500):", message);

    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" satisfies ImageErrorCode },
      { status: 500 }
    );
  }
}