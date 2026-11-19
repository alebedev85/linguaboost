import { NextResponse } from "next/server";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_IMAGE_MODEL =
  process.env.CLOUDFLARE_IMAGE_MODEL || "@cf/black-forest-labs/flux-1-schnell";

type CloudflareErrorCode =
  | "BAD_REQUEST"
  | "MISSING_CONFIG"
  | "AUTH_ERROR"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "INVALID_JSON"
  | "NO_IMAGE_DATA"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

class CloudflareImageError extends Error {
  status: number;
  code: CloudflareErrorCode;
  retryAfter?: string | null;

  constructor(
    message: string,
    status: number,
    code: CloudflareErrorCode,
    retryAfter?: string | null
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

function buildIllustrationPrompt(rawPrompt: string): string {
  return `A single isolated 2D flat vector illustration representing the meaning of "${rawPrompt}", no text, no watermarks`;
}

function classifyCloudflareFailure(
  httpStatus: number,
  rawBody: string,
  parsedJson: any,
  retryAfter: string | null
): CloudflareImageError {
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
  const hasQuotaErrorCode = apiErrors.some((err) => err?.code === 4006);
  const isDailyQuotaExhausted =
    hasQuotaErrorCode ||
    lower.includes("daily free allocation") ||
    lower.includes("neurons") ||
    lower.includes("quota");

  if (httpStatus === 429) {
    if (isDailyQuotaExhausted) {
      return new CloudflareImageError(
        `Исчерпан дневной лимит Neurons в Cloudflare Workers AI (сброс в 00:00 UTC): ${combinedMessage}`,
        429,
        "QUOTA_EXCEEDED",
        retryAfter
      );
    }

    return new CloudflareImageError(
      `Слишком много запросов к Cloudflare Workers AI (rate limit): ${combinedMessage}`,
      429,
      "RATE_LIMITED",
      retryAfter
    );
  }

  if (httpStatus === 401 || httpStatus === 403) {
    return new CloudflareImageError(
      `Ошибка авторизации Cloudflare (проверь CLOUDFLARE_API_TOKEN и права Workers AI): ${combinedMessage}`,
      httpStatus,
      "AUTH_ERROR"
    );
  }

  const mappedStatus =
    httpStatus >= 400 && httpStatus < 500 ? httpStatus : 502;

  return new CloudflareImageError(
    `Ошибка Cloudflare Workers AI (${httpStatus}): ${combinedMessage}`,
    mappedStatus,
    "UPSTREAM_ERROR"
  );
}

async function generateWithCloudflare(rawPrompt: string): Promise<{
  imageBase64: string;
  mimeType: string;
}> {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new CloudflareImageError(
      "Не заданы CLOUDFLARE_ACCOUNT_ID или CLOUDFLARE_API_TOKEN в переменных окружения",
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
        prompt: buildIllustrationPrompt(rawPrompt),
        steps: 4,
      }),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Неизвестная сетевая ошибка";
    throw new CloudflareImageError(
      `Сетевая ошибка при обращении к Cloudflare Workers AI: ${message}`,
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
      throw new CloudflareImageError(
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
      retryAfter
    );
  }

  const base64Image = parsedJson?.result?.image;
  if (typeof base64Image !== "string" || base64Image.trim().length === 0) {
    throw new CloudflareImageError(
      "В ответе Cloudflare Workers AI отсутствует result.image",
      422,
      "NO_IMAGE_DATA"
    );
  }

  // На случай если строка уже содержит data URI prefix
  const normalizedBase64 = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  return {
    imageBase64: normalizedBase64,
    mimeType: "image/jpeg",
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
          code: "BAD_REQUEST" satisfies CloudflareErrorCode,
        },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType } = await generateWithCloudflare(promptForFlux);

    return NextResponse.json({
      imageBase64,
      mimeType,
      model: CF_IMAGE_MODEL,
      provider: "cloudflare-workers-ai",
    });
  } catch (err: unknown) {
    if (err instanceof CloudflareImageError) {
      console.error(`🔴 [${err.code}] (${err.status}): ${err.message}`);

      const headers = new Headers();
      if (err.retryAfter) {
        headers.set("Retry-After", err.retryAfter);
      }

      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
          ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}),
        },
        { status: err.status, headers }
      );
    }

    const message =
      err instanceof Error ? err.message : "Непредвиденная ошибка сервера";
    console.error("🔴 [INTERNAL_ERROR] (500):", message);

    return NextResponse.json(
      {
        error: message,
        code: "INTERNAL_ERROR" satisfies CloudflareErrorCode,
      },
      { status: 500 }
    );
  }
}