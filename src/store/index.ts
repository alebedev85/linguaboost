import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./slices/authSlice";
import dictionaryReducer from "./slices/dictionarySlice";
import trainingReducer from "./slices/trainingSlice";
import uiReducer from "./slices/uiSlice";

// ИМПОРТ: Подключи свой экшен уведомлений (название и путь могут немного отличаться)
import { showNotificationWithTimeout } from "./slices/uiSlice";

const LOCAL_STORAGE_AUTH_KEY = "linguaboost_user_session";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dictionary: dictionaryReducer,
    ui: uiReducer,
    training: trainingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

/**
 * Отслеживание сессии + Глобальные уведомления
 */
let previousUserId: string | null | undefined = undefined;
// Флаг, чтобы не спамить уведомлением "Вход выполнен" при самой первой загрузке страницы из localStorage
let isFirstLoad = true;

store.subscribe(() => {
  if (typeof window === "undefined") return;

  const state = store.getState();
  const currentUser = state.auth.user;
  const currentUserId = currentUser?.uid || null; // Нормализуем к string | null

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем строгое изменение ID пользователя.
  // Когда прилетит диспатч от уведомлений, currentUserId и previousUserId будут одинаковыми,
  // и мы просто проигнорируем этот прогон, разорвав бесконечный цикл!
  if (previousUserId !== currentUserId) {
    // Сразу фиксируем новое состояние, чтобы параллельные вызовы не успели проскочить
    const oldUserId = previousUserId;
    previousUserId = currentUserId;

    try {
      if (currentUser) {
        // 1. Срабатывает при ВХОДЕ
        localStorage.setItem(
          LOCAL_STORAGE_AUTH_KEY,
          JSON.stringify(currentUser),
        );

        if (!isFirstLoad) {
          store.dispatch(
            showNotificationWithTimeout({
              text: `👋 Добро пожаловать! Вы вошли как ${currentUser.isAnonymous ? "Гость" : currentUser.email}`,
              type: "success",
            }),
          );
        }
      } else {
        // 2. Срабатывает при ВЫХОДЕ
        localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);

        // Показываем уведомление, только если до этого реально был авторизованный юзер
        if (oldUserId !== null) {
          store.dispatch(
            showNotificationWithTimeout({
              text: "🚪 Вы успешно вышли из профиля",
              type: "info",
            }),
          );
        }
      }
    } catch (err) {
      console.error("Синхронизация сессии/уведомлений дала сбой:", err);
    }

    isFirstLoad = false;
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
