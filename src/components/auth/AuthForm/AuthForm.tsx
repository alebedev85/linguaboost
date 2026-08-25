"use client";

import ActionButton from "@/components/ui/ActionButton/ActionButton";
import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
import styles from "./AuthForm.module.scss";

interface AuthFormProps {
  initialRegisterMode?: boolean; // Принимаем начальный режим из URL
  onAuthSuccess?: (mode: "login" | "register" | "guest") => void;
}

export default function AuthForm({
  initialRegisterMode = false, // По умолчанию — Авторизация (не регистрация!)
  onAuthSuccess,
}: AuthFormProps) {
  const { registerWithEmail, loginWithEmail, loginAsGuest } = useAuth();

  // Устанавливаем режим на основе пропса
  const [isRegisterMode] = useState(initialRegisterMode);

  // Контролируемые поля ввода
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isLoading) return;

    try {
      setIsLoading(true);

      if (isRegisterMode) {
        await registerWithEmail(email, password);
        onAuthSuccess?.("register");
      } else {
        await loginWithEmail(email, password);
        onAuthSuccess?.("login");
      }
    } catch (error) {
      console.error("Auth error caught in form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      await loginAsGuest();
      onAuthSuccess?.("guest");
    } catch (error) {
      console.error("Guest auth error caught in form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.blurOrb} />

      <h2 className={styles.title}>
        {isRegisterMode ? "Регистрация профиля" : "Авторизация"}
      </h2>

      <p className={styles.subtitle}>
        {isRegisterMode
          ? "Создайте персональный аккаунт по приглашению"
          : "Войдите, чтобы продолжить обучение и синхронизировать прогресс"}
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            required
            placeholder="name@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Пароль</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>

        <ActionButton
          type="submit"
          variant="primary"
          fontSize="sm"
          disabled={isLoading || !email.trim() || !password.trim()}
        >
          {isLoading
            ? "Обработка..."
            : isRegisterMode
              ? "Создать аккаунт"
              : "Войти в аккаунт"}
        </ActionButton>
      </form>

      {/* Убрали кнопку переключения режимов. 
          Теперь обычный пользователь не может самостоятельно включить регистрацию */}

      <div className={styles.divider}>
        <span className={styles.dividerText}>Или</span>
      </div>

      <button
        type="button"
        className={styles.guestBtn}
        onClick={handleGuestLogin}
        disabled={isLoading}
      >
        🚀 Войти в гостевом режиме (быстрый старт)
      </button>
    </div>
  );
}