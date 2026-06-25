"use client";

import { auth } from "@/core/firebase";
import { useAppDispatch, useAppSelector } from "@/store";
import { setError, setLoading } from "@/store/slices/authSlice";
import { showNotificationWithTimeout } from "@/store/slices/uiSlice"; // Импортируем санку уведомлений
import { 
  signInAnonymously, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  // Регистрация по Email и Паролю
  const registerWithEmail = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      await createUserWithEmailAndPassword(auth, email, password);
      
      // Показываем уведомление об успешной регистрации
      dispatch(showNotificationWithTimeout({
        text: "Аккаунт успешно создан! Добро пожаловать.",
        type: "success"
      }));
    } catch (err: any) {
      let customError = "Не удалось создать аккаунт";
      if (err.code === "auth/email-already-in-use") {
        customError = "Этот Email уже используется";
      } else if (err.code === "auth/weak-password") {
        customError = "Пароль слишком слабый (минимум 6 символов)";
      } else if (err.code === "auth/invalid-email") {
        customError = "Некорректный формат Email";
      }
      
      dispatch(setError(err.message || customError));
      
      // Выводим ошибку во всплывающее уведомление
      dispatch(showNotificationWithTimeout({
        text: customError,
        type: "error"
      }));
      
      throw err;
    }
  };

  // Вход по Email и Паролю
  const loginWithEmail = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      await signInWithEmailAndPassword(auth, email, password);
      
      dispatch(showNotificationWithTimeout({
        text: "Вход выполнен успешно!",
        type: "success"
      }));
    } catch (err: any) {
      let customError = "Не удалось войти в аккаунт";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        customError = "Неверный Email или пароль";
      }
      
      dispatch(setError(err.message || customError));
      
      dispatch(showNotificationWithTimeout({
        text: customError,
        type: "error"
      }));
      
      throw err;
    }
  };

  // Гостевой вход
  const loginAsGuest = async () => {
    try {
      dispatch(setLoading(true));
      await signInAnonymously(auth);
      
      dispatch(showNotificationWithTimeout({
        text: "Вошли как гость. Прогресс сохраняется в текущей сессии!",
        type: "info"
      }));
    } catch (err: any) {
      const customError = "Не удалось войти в гостевом режиме";
      dispatch(setError(err.message || customError));
      
      dispatch(showNotificationWithTimeout({
        text: customError,
        type: "error"
      }));
    }
  };

  // Выход из системы
  const logout = async () => {
    try {
      dispatch(setLoading(true));
      await signOut(auth);
      
      dispatch(showNotificationWithTimeout({
        text: "Вы вышли из системы",
        type: "info"
      }));
    } catch (err: any) {
      console.error("Ошибка выхода:", err);
      dispatch(showNotificationWithTimeout({
        text: "Ошибка при выходе из аккаунта",
        type: "error"
      }));
    }
  };

  return { 
    user, 
    loading, 
    error, 
    registerWithEmail, 
    loginWithEmail, 
    loginAsGuest, 
    logout 
  };
};