export const APP_ID = 'english-vocab-learning-app';
export const GEMINI_API_KEY: string = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

// Используем "as const", чтобы сделать объект конфигурации read-only и типизировать его значения как литералы
export const TRAINING_CONFIG = {
  WORDS_PER_SESSION: 6,
  MIN_WORDS_TO_START: 2,
  ERROR_OVERLAY_DURATION: 3000, // 3 секунды фиксации ошибки из ТЗ
  SUCCESS_OVERLAY_DURATION: 1500,
  PROGRESS_STEP: 35,
  MAX_PROGRESS: 100,
} as const;

// Интерфейс для путей Firestore, чтобы гарантировать передачу строковых аргументов
interface IFirestorePaths {
  profiles: (uid: string) => string;
  words: (uid: string, profile: string) => string;
  wordDoc: (uid: string, profile: string, wordId: string) => string;
}

export const FIRESTORE_PATHS: IFirestorePaths = {
  profiles: (uid: string) => `artifacts/${APP_ID}/users/${uid}/settings/profiles`,
  words: (uid: string, profile: string) => `artifacts/${APP_ID}/users/${uid}/profiles/${profile}/words`,
  wordDoc: (uid: string, profile: string, wordId: string) => `artifacts/${APP_ID}/users/${uid}/profiles/${profile}/words/${wordId}`,
};