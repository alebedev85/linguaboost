import { NextResponse } from "next/server";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_IMAGE_MODEL =
  process.env.CLOUDFLARE_IMAGE_MODEL || "@cf/black-forest-labs/flux-1-schnell";

function parseAdminEmails(): string[] {
  const rawList = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return rawList
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

const ADMIN_EMAILS = parseAdminEmails();

type ImageErrorCode =
  | "BAD_REQUEST"
  | "MISSING_CONFIG"
  | "AUTH_ERROR"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "NSFW_BLOCKED"
  | "NETWORK_ERROR"
  | "INVALID_JSON"
  | "NO_IMAGE_DATA"
  | "UPSTREAM_ERROR"
  | "GENERATION_FAILED"
  | "INTERNAL_ERROR";

class ImageRouteError extends Error {
  status: number;
  code: ImageErrorCode;
  retryAfter?: string | null;

  constructor(
    message: string,
    status: number,
    code: ImageErrorCode,
    retryAfter?: string | null
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

function buildCloudflarePrompt(rawPrompt: string): string {
  return `No text, no watermarks, only single isolated 2D flat vector illustration representing the concept "${rawPrompt}"`;
}

function buildPollinationsPrompt(rawPrompt: string): string {
  return `Simple flat vector illustration of ${rawPrompt}, no text, no watermarks`;
}

function classifyCloudflareFailure(
  httpStatus: number,
  rawBody: string,
  parsedJson: any,
  retryAfter: string | null,
  rawPrompt: string
): ImageRouteError {
  const apiErrors: Array<{ code?: number; message?: string }> = Array.isArray(
    parsedJson?.errors
  )
    ? parsedJson.errors
    : [];

  const combinedMessage =
    apiErrors
      .map((err) => (err?.code ? `[${err.code}] ${err.message}` : err?.message))
      .filter(Boolean)
      .join("; ") ||
    parsedJson?.error ||
    rawBody.slice(0, 300) ||
    "Неизвестная ошибка Cloudflare Workers AI";

  const lower = combinedMessage.toLowerCase();

  const isNsfwBlocked =
    apiErrors.some((err) => err?.code === 8007) || lower.includes("nsfw");
  if (isNsfwBlocked) {
    return new ImageRouteError(
      `Фильтр Cloudflare заблокировал промпт для "${rawPrompt}" (код 8007): ${combinedMessage}`,
      422,
      "NSFW_BLOCKED"
    );
  }

  const hasQuotaErrorCode = apiErrors.some((err) => err?.code === 4006);
  const isDailyQuotaExhausted =
    hasQuotaErrorCode ||
    lower.includes("daily free allocation") ||
    lower.includes("neurons") ||
    lower.includes("quota");

  if (httpStatus === 429) {
    if (isDailyQuotaExhausted) {
      return new ImageRouteError(
        `Исчерпан дневной лимит Neurons в Cloudflare Workers AI: ${combinedMessage}`,
        429,
        "QUOTA_EXCEEDED",
        retryAfter
      );
    }

    return new ImageRouteError(
      `Rate limit Cloudflare Workers AI: ${combinedMessage}`,
      429,
      "RATE_LIMITED",
      retryAfter
    );
  }

  if (httpStatus === 401 || httpStatus === 403) {
    return new ImageRouteError(
      `Ошибка авторизации Cloudflare Workers AI: ${combinedMessage}`,
      httpStatus,
      "AUTH_ERROR"
    );
  }

  const status = httpStatus >= 400 && httpStatus < 500 ? httpStatus : 502;
  return new ImageRouteError(
    `Ошибка Cloudflare Workers AI (${httpStatus}): ${combinedMessage}`,
    status,
    "UPSTREAM_ERROR"
  );
}

// Провайдер 1 (PRO): Cloudflare Workers AI (flux-1-schnell)
async function generateViaCloudflare(rawPrompt: string): Promise<{
  imageBase64: string;
  mimeType: string;
}> {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new ImageRouteError(
      "Не заданы CLOUDFLARE_ACCOUNT_ID или CLOUDFLARE_API_TOKEN",
      500,
      "MISSING_CONFIG"
    );
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
    CLOUDFLARE_ACCOUNT_ID
  )}/ai/run/${CF_IMAGE_MODEL}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: buildCloudflarePrompt(rawPrompt),
        steps: 4,
      }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Сетевая ошибка";
    throw new ImageRouteError(
      `Сетевая ошибка Cloudflare Workers AI: ${message}`,
      502,
      "NETWORK_ERROR"
    );
  }

  const retryAfter = response.headers.get("retry-after");
  const rawText = await response.text();

  let parsedJson: any = null;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    if (response.ok) {
      throw new ImageRouteError(
        "Cloudflare Workers AI вернул некорректный JSON",
        502,
        "INVALID_JSON"
      );
    }
  }

  if (!response.ok || parsedJson?.success === false) {
    throw classifyCloudflareFailure(
      response.status,
      rawText,
      parsedJson,
      retryAfter,
      rawPrompt
    );
  }

  const rawImage = parsedJson?.result?.image;
  if (typeof rawImage !== "string" || rawImage.trim().length === 0) {
    throw new ImageRouteError(
      "В ответе Cloudflare Workers AI отсутствует result.image",
      422,
      "NO_IMAGE_DATA"
    );
  }

  const normalizedBase64 = rawImage.includes(",")
    ? rawImage.split(",")[1]
    : rawImage;

  return {
    imageBase64: normalizedBase64,
    mimeType: "image/jpeg",
  };
}

// Провайдер 2 (Standard / Fallback): Pollinations.ai
async function generateViaPollinations(rawPrompt: string): Promise<{
  imageBase64: string;
  mimeType: string;
} | null> {
  try {
    const prompt = buildPollinationsPrompt(rawPrompt);
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/p/${encodeURIComponent(
      prompt
    )}?width=512&height=512&nologo=true&model=flux&seed=${seed}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error("🔴 [Pollinations Error] HTTP:", response.status);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength) return null;

    return {
      imageBase64: Buffer.from(arrayBuffer).toString("base64"),
      mimeType: response.headers.get("content-type") || "image/jpeg",
    };
  } catch (error) {
    console.error("🔴 [Pollinations Error]:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const promptForFlux =
      typeof body?.promptForFlux === "string" ? body.promptForFlux.trim() : "";
    const userEmail =
      typeof body?.userEmail === "string" ? body.userEmail.trim().toLowerCase() : "";

    if (!promptForFlux) {
      return NextResponse.json(
        {
          error: "Не передан обязательный параметр promptForFlux",
          code: "BAD_REQUEST" satisfies ImageErrorCode,
        },
        { status: 400 }
      );
    }

    const isAdmin = Boolean(userEmail) && ADMIN_EMAILS.includes(userEmail);

    if (isAdmin) {
      console.log(`⚡ PRO-режим (${userEmail}): генерация через Cloudflare Workers AI`);

      try {
        const cfResult = await generateViaCloudflare(promptForFlux);
        return NextResponse.json({
          imageBase64: cfResult.imageBase64,
          mimeType: cfResult.mimeType,
          provider: "cloudflare-workers-ai",
          model: CF_IMAGE_MODEL,
          isProMode: true,
        });
      } catch (cfError: unknown) {
        const code =
          cfError instanceof ImageRouteError ? cfError.code : "UPSTREAM_ERROR";
        const message =
          cfError instanceof Error ? cfError.message : "Ошибка Cloudflare Workers AI";

        console.warn(
          `⚠️ Ошибка PRO-генерации [${code}]: ${message}. Переключаемся на Pollinations...`
        );

        const fallbackResult = await generateViaPollinations(promptForFlux);
        if (fallbackResult) {
          return NextResponse.json({
            imageBase64: fallbackResult.imageBase64,
            mimeType: fallbackResult.mimeType,
            provider: "pollinations",
            isProMode: false,
            fallbackReason: code,
          });
        }

        // Если и fallback не справился — отдаём диагностику ошибки Cloudflare
        if (cfError instanceof ImageRouteError) {
          return NextResponse.json(
            { error: cfError.message, code: cfError.code },
            { status: cfError.status }
          );
        }

        return NextResponse.json(
          {
            error: "Не удалось сгенерировать изображение ни через Cloudflare, ни через Pollinations",
            code: "GENERATION_FAILED" satisfies ImageErrorCode,
          },
          { status: 502 }
        );
      }
    }

    // Обычный пользователь или гость -> сразу Pollinations.ai
    console.log(
      `🌱 Обычный режим (${userEmail || "гость"}): генерация через Pollinations`
    );
    const pollinationsResult = await generateViaPollinations(promptForFlux);

    if (!pollinationsResult) {
      return NextResponse.json(
        {
          error: "Не удалось сгенерировать изображение через Pollinations.ai",
          code: "GENERATION_FAILED" satisfies ImageErrorCode,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      imageBase64: pollinationsResult.imageBase64,
      mimeType: pollinationsResult.mimeType,
      provider: "pollinations",
      isProMode: false,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Внутренняя ошибка сервера";
    console.error("🔴 [INTERNAL_ERROR] (500):", message);

    return NextResponse.json(
      {
        error: message,
        code: "INTERNAL_ERROR" satisfies ImageErrorCode,
      },
      { status: 500 }
    );
  }
}