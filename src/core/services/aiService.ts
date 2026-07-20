import axios from "axios";

interface ApiWordResponse {
  translation: string;
  example: string;
  visualPrompt?: string; // 🔥 Добавили опциональное поле ответа Gemini
}

interface ApiImageResponse {
  imageBase64: string | null;
}

// Интерфейс для ответа роута озвучки
interface ApiAudioResponse {
  base64Audio: string;
}

export const aiService = {
  /**
   * Запрашивает автоматический перевод слова, контекст и визуальный образ у нашего Next API (/api/translate)
   */
  async getTranslationAndContext(
    word: string,
  ): Promise<{ translation: string; example: string; visualPrompt?: string }> {
    // 🔥 Обновили тип возвращаемого значения
    try {
      const response = await axios.post<ApiWordResponse>("/api/translate", {
        word: word.trim(),
      });

      if (!response.data || !response.data.translation) {
        throw new Error("Бэкенд вернул пустой перевод");
      }

      return {
        translation: response.data.translation,
        example: response.data.example || "",
        visualPrompt: response.data.visualPrompt, // 🔥 Пробрасываем визуальный промпт на фронтенд
      };
    } catch (error: any) {
      const serverErrorMessage = error.response?.data?.error;

      if (serverErrorMessage) {
        console.error(
          `🔴 Бэкенд перевода вернул ошибку: ${serverErrorMessage}`,
        );
        error.message = serverErrorMessage;
      } else {
        console.error(
          "🔴 Ошибка внутри aiService.getTranslationAndContext:",
          error,
        );
      }

      throw error;
    }
  },

  /**
   * Запрашивает фоновую генерацию изображения у нашего Next API (/api/generate-image)
   * Возвращает готовую Base64 строку или null в случае неудачи
   */
  async getImageForWord(
    visualPrompt: string | undefined,
    word: string,
  ): Promise<string | null> {
    try {
      // 🔥 Изменили ключ отправки на visualPrompt, чтобы бэкенд Next.js его сразу подхватил
      const response = await axios.post<ApiImageResponse>(
        "/api/generate-imagen",
        {
          promptForFlux: visualPrompt ? `${word.trim()} means ${visualPrompt.trim()}` : word.trim(),
        },
      );

      return response.data?.imageBase64 || null;
    } catch (error: any) {
      const serverErrorMessage = error.response?.data?.error;

      if (serverErrorMessage) {
        console.error(
          `⚠️ Бэкенд генерации картинок вернул ошибку: ${serverErrorMessage}`,
        );
      } else {
        console.error("⚠️ Ошибка внутри aiService.getImageForWord:", error);
      }

      return null;
    }
  },

  /**
   * Запрашивает генерацию аудио (TTS) у нашего Next API (/api/tts)
   * Возвращает строку base64 с аудиоданными
   */
  async getAudioTextToSpeech(text: string): Promise<string> {
    try {
      const response = await axios.post<ApiAudioResponse>("/api/tts", {
        text: text.trim(),
      });

      // console.log("🔊 Ответ от бэкенда озвучки (TTS) получен");

      if (!response.data || !response.data.base64Audio) {
        throw new Error("Бэкенд вернул пустые аудиоданные");
      }

      return response.data.base64Audio;
    } catch (error: any) {
      const serverErrorMessage = error.response?.data?.error;

      if (serverErrorMessage) {
        console.error(`🔴 Бэкенд озвучки вернул ошибку: ${serverErrorMessage}`);
        error.message = serverErrorMessage;
      } else {
        console.error(
          "🔴 Ошибка внутри aiService.getAudioTextToSpeech:",
          error,
        );
      }

      throw error;
    }
  },
};
