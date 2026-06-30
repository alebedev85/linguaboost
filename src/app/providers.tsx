"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/core/firebase";
import { setUser, setLoading } from "@/store/slices/authSlice";
import { fetchWordsThunk } from "@/store/slices/dictionarySlice";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // При холодном старте приложения запускаем один главный лоадер
    store.dispatch(setLoading(true));

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. Сначала записываем данные пользователя в стейт
        store.dispatch(setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || 'Гостевой профиль',
          isAnonymous: firebaseUser.isAnonymous,
        }));

        try {
          // 2. Запускаем загрузку словаря и ЖДЕМ её завершения
          // .unwrap() позволяет обработать thunk как стандартный Promise
          await store.dispatch(fetchWordsThunk()).unwrap();
        } catch (error) {
          console.error("Ошибка при загрузке словаря на старте:", error);
        } finally {
          // 3. Выключаем глобальный лоадер ТОЛЬКО после того, как слова загрузились (или упали с ошибкой)
          store.dispatch(setLoading(false));
        }
      } else {
        store.dispatch(setUser(null));
        // Если пользователя нет, то и слова загружать не нужно — сразу выключаем лоадер
        store.dispatch(setLoading(false));
      }
    });

    return () => unsubscribe();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}