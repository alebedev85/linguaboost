import { aiService } from "@/core/services/aiService";
import { useAppDispatch } from "@/store";
import { showNotificationWithTimeout } from "@/store/slices/uiSlice";
import { useCallback, useState } from "react";

// Вспомогательная функция сборки WAV-файла из сырых PCM-данных, которые присылает Gemini
function pcmToWavUrl(base64Audio: string, sampleRate = 24000): string {
  const byteCharacters = atob(base64Audio);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const buffer = new Uint8Array(byteNumbers).buffer;

  // Формируем стандартный заголовк WAV (RIFF)
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  view.setUint32(0, 0x46464952, true); // "RIFF"
  view.setUint32(4, 36 + buffer.byteLength, true);
  view.setUint32(8, 0x45564157, true); // "WAVE"
  view.setUint32(12, 0x20746d66, true); // "fmt "
  view.setUint32(16, 16, true); // Размер подблока
  view.setUint16(20, 1, true); // Аудио-формат (PCM = 1)
  view.setUint16(22, 1, true); // Количество каналов (Моно)
  view.setUint32(24, sampleRate, true); // Частота дискретизации
  view.setUint32(28, sampleRate * 2, true); // Байт в секунду
  view.setUint16(32, 2, true); // Выравнивание блока
  view.setUint16(34, 16, true); // Глубина звука (16 бит)
  view.setUint32(36, 0x61746164, true); // "data"
  view.setUint32(40, buffer.byteLength, true);

  const blob = new Blob([header, buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

export function useGeminiTTS() {
  const dispatch = useAppDispatch();
  const [isPlaying, setIsPlaying] = useState(false);

  // // Браузерная озвучка (вместо вызова Gemini)
  // const speak = (text: string) => {
  //   const utterance = new SpeechSynthesisUtterance(text);
  //   utterance.lang = "en-US";
  //   window.speechSynthesis.speak(utterance);
  // };

  const speak = useCallback(
    async (text: string) => {
      console.log("Gemini TTS speak called with text:", text);
      if (!text) return;

      // Защита от дребезга
      let alreadyPlaying = false;
      setIsGeneratingSignal: setIsPlaying((prev) => {
        alreadyPlaying = prev;
        return prev;
      });
      if (alreadyPlaying) return;

      try {
        setIsPlaying(true);

        const base64Audio = await aiService.getAudioTextToSpeech(text);

        const wavUrl = pcmToWavUrl(base64Audio, 24000);
        const audio = new Audio(wavUrl);

        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(wavUrl);
        };

        await audio.play().catch((playError) => {
          URL.revokeObjectURL(wavUrl);
          throw playError;
        });
      } catch (err: any) {
        console.error("Gemini TTS Error:", err);

        dispatch(
          showNotificationWithTimeout({
            text: err.message.includes("лимит")
              ? err.message
              : "Не удалось сгенерировать озвучку",
            type: "error",
          }) as any
        );

        setIsPlaying(false);
      }
    },
    [dispatch] // Сюда больше не нужен apiKey, хук максимально автономен!
  );

  return { speak, isPlaying };
}
