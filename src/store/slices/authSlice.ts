import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '@/core/types';

interface AuthState {
  user: IUser | null;
  loading: boolean;
  isFallback: boolean;
  error: string | null;
}

const rawAdminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
const ADMIN_EMAILS = rawAdminEmails
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean); // Удаляем пустые строки, если в конце стояла запятая

const initialState: AuthState = {
  user: null,
  loading: true, // Начинаем со статуса загрузки, пока проверяется сессия
  isFallback: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Вызывается при успешном входе (как через Firebase, так и при моках/локальном режиме)
    setUser: (state, action: PayloadAction<IUser | null>) => {
      const userData = action.payload;

      if (userData) {
        // Вычисляем статус админа при установке юзера
        const isAdmin = Boolean(
          userData.email && ADMIN_EMAILS.includes(userData.email.toLowerCase())
        );
        state.user = {
          ...userData,
          isAdmin,
        };
      } else {
        state.user = null;
      }

      state.error = null;
    },
    // Включается, если Firebase заблокирован (например, провайдером или сетью)
    setFallbackMode: (state, action: PayloadAction<string>) => {
      state.isFallback = true;
      state.user = {
        uid: action.payload,
        email: 'Локальный профиль',
        isAnonymous: true,
      };
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    // Очистка состояния при выходе
    logoutUser: (state) => {
      state.user = null;
      state.isFallback = false;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setUser, setFallbackMode, setLoading, setError, logoutUser } = authSlice.actions;
export default authSlice.reducer;