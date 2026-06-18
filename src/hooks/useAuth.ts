"use client";

import { auth } from "@/core/firebase";
import { useAppDispatch, useAppSelector } from "@/store";
import { setError, setLoading } from "@/store/slices/authSlice";
import { signInAnonymously, signOut } from "firebase/auth";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const loginAsGuest = async () => {
    try {
      dispatch(setLoading(true));
      await signInAnonymously(auth);
    } catch (err: any) {
      dispatch(setError(err.message || "Не удалось войти в гостевом режиме"));
    }
  };

  const logout = async () => {
    try {
      dispatch(setLoading(true));
      await signOut(auth);
    } catch (err: any) {
      console.error("Ошибка выхода:", err);
    }
  };

  return { user, loading, error, loginAsGuest, logout };
};
