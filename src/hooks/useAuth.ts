"use client";

import { useAppDispatch, useAppSelector } from '@/store';
import { setUser, setLoading, logoutUser } from '@/store/slices/authSlice';
import { IUser } from '@/core/types';
import { useEffect } from 'react';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  
  // Достаем реактивное состояние из Redux. 
  // Благодаря preloadedState в конфигурации стора, здесь уже на старте будет юзер, если он залогинен.
  const { user, loading, error } = useAppSelector((state) => state.auth);

  // Чтение из localStorage переезжает сюда: это сработает строго ПОСЛЕ гидратации
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSession = localStorage.getItem('linguaboost_user_session');
        if (savedSession) {
          const parsedUser: IUser = JSON.parse(savedSession);
          dispatch(setUser(parsedUser));
        } else {
          dispatch(setLoading(false)); // Если сессии нет, просто выключаем лоадер
        }
      } catch (err) {
        console.error("Ошибка восстановления сессии:", err);
        dispatch(setLoading(false));
      }
    }
  }, [dispatch]);

  /**
   * Имитация гостевого входа для этапа верстки.
   * При интеграции Firebase этот метод заменится на signInAnonymously(auth).
   */
  const loginAsGuest = () => {
    dispatch(setLoading(true));
    
    // Небольшой таймаут для имитации сетевого запроса и демонстрации Loader
    setTimeout(() => {
      const guestUser: IUser = {
        uid: `guest_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
        email: 'tester@linguaboost.dev',
        isAnonymous: true,
      };
      
      // Просто сетаем пользователя в стор. 
      // Центральный subscribe в store/index.ts сам перехватит этот экшен и запишет сессию в localStorage.
      dispatch(setUser(guestUser));
    }, 500);
  };

  /**
   * Функция выхода из профиля
   */
  const logout = () => {
    dispatch(logoutUser());
  };

  return {
    user,
    loading,
    error,
    loginAsGuest,
    logout
  };
};