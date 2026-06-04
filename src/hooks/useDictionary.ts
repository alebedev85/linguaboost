import { useAppDispatch, useAppSelector } from '@/store';
import { db, fetchWithRetry } from '@/core/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { FIRESTORE_PATHS, GEMINI_API_KEY } from '@/core/constants';
import { IWord } from '@/core/types';

// Описываем интерфейс ответа от Gemini API
interface IGeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

// Интерфейс для результата перевода, который мы ждем от JSON ИИ
interface ITranslationResult {
  russian: string;
  context: string;
  imageUrl: string;
}

export const useDictionary = () => {
  const dispatch = useAppDispatch();
  
  // Юзаем наши типизированные селекторы — теперь TS знает, что внутри auth и dictionary
  const { user } = useAppSelector((state) => state.auth);
  const { currentProfile, words } = useAppSelector((state) => state.dictionary);

  // Функция перевода через Gemini API с типизацией возвращаемого промиса
  const translateWordAI = async (word: string): Promise<ITranslationResult> => {
    const prompt = `Translate "${word}" into Russian...`; // Твой промпт
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }], 
        generationConfig: { responseMimeType: "application/json" } 
      })
    });

    const data = response as IGeminiResponse;
    const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) {
      throw new Error('Не удалось получить ответ от Gemini API');
    }

    return JSON.parse(jsonText) as ITranslationResult;
  };

  // Добавление слова в Firestore с типизацией входящих аргументов
  const addWordToProfile = async (
    english: string, 
    russian: string, 
    context: string,
    imageUrl: string = ''
  ): Promise<void> => {
    if (!user) return;

    const path = FIRESTORE_PATHS.words(user.uid, currentProfile);
    
    // Создаем объект слова, строго соответствующий интерфейсу IWord
    const newWord: Omit<IWord, 'id'> = {
      english,
      russian,
      context,
      imageUrl,
      status: 'new',
      progress: 0,
      createdAt: new Date().toISOString() // Можно заменить на serverTimestamp(), если нужно серверное время
    };

    await addDoc(collection(db, path), newWord);
  };

  return { words, currentProfile, translateWordAI, addWordToProfile };
};