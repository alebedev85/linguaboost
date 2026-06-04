import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Расширяем глобальный объект Window, чтобы TS не ругался на кастомное свойство
declare global {
  interface Window {
    __firebase_config?: string;
  }
}

const firebaseConfig: FirebaseOptions = typeof window !== 'undefined' && window.__firebase_config 
  ? JSON.parse(window.__firebase_config) 
  : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Экспоненциальный бэк-офф для обработки ошибок (включая Rate Limit Error 429)
 * возвращает типизированный ответ Promise<any>
 */
export const fetchWithRetry = async (
  url: string, 
  options: RequestInit, 
  retries: number = 5, 
  delay: number = 1000
): Promise<any> => {
  let currentDelay = delay;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status === 429) {
        await new Promise(res => setTimeout(res, currentDelay));
        currentDelay *= 2; // Удваиваем интервал ожидания
        continue;
      }
      
      throw new Error(`HTTP Error: ${response.status}`);
    } catch (err) {
      if (i === retries - 1) {
        throw err;
      }
      await new Promise(res => setTimeout(res, currentDelay));
      currentDelay *= 2;
    }
  }
};