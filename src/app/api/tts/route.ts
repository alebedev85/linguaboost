import { NextResponse } from "next/server";
import { EdgeTTS } from "node-edge-tts";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Текст не указан" }, { status: 400 });
    }

    // Инициализируем TTS с нужным голосом en-GB (британский)
    const tts = new EdgeTTS({
      voice: "en-GB-RyanNeural", // Известный качественный британский голос
      lang: "en-GB",
      outputFormat: "audio-24khz-96kbitrate-mono-mp3",
    });

    // Создаем путь к временному файлу в операционной системе
    const tempDir = os.tmpdir();
    const tempFilename = `tts-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.mp3`;
    const tempFilePath = path.join(tempDir, tempFilename);

    try {
      // 1. Библиотека генерирует аудио и записывает его во временный файл
      await tts.ttsPromise(text, tempFilePath);

      // 2. Читаем файл в буфер памяти
      const audioBuffer = await fs.readFile(tempFilePath);

      // 3. Кодируем в Base64 для фронтенда
      const base64Audio = audioBuffer.toString("base64");

      // 4. Обязательно удаляем временный файл, чтобы не забивать диск
      await fs.unlink(tempFilePath);

      return NextResponse.json({ base64Audio });

    } catch (innerError) {
      // На случай сбоя при записи/чтении файла гарантируем попытку удаления
      try {
        await fs.unlink(tempFilePath);
      } catch {}
      throw innerError;
    }

  } catch (error: any) {
    console.error("🔴 [Edge TTS Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Ошибка генерации Edge TTS" },
      { status: 500 }
    );
  }
}