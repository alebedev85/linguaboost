"use client";

import ActionButton from "@/components/ui/ActionButton/ActionButton";
import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
import styles from "./AuthForm.module.scss";

interface AuthFormProps {
  onAuthSuccess?: (mode: "login" | "register" | "guest") => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const { loginAsGuest, loading } = useAuth();
  // Режим формы: true — Регистрация, false — Вход
  const [isRegisterMode, setIsRegisterMode] = useState(true);

  // Контролируемые поля ввода
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Отправка формы (Регистрация или Вход)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isLoading) return;

    try {
      setIsLoading(true);

      if (isRegisterMode) {
        console.log("Регистрация пользователя:", { email, password });
        // TODO: Здесь будет вызов метода регистрации (например, authService.register)
      } else {
        console.log("Вход в систему:", { email, password });
        // TODO: Здесь будет вызов метода входа (например, authService.login)
      }

      onAuthSuccess?.(isRegisterMode ? "register" : "login");
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Декоративное размытое свечение */}
      <div className={styles.blurOrb} />

      <h2 className={styles.title}>
        {isRegisterMode ? "Регистрация профиля" : "Авторизация"}
      </h2>

      <p className={styles.subtitle}>
        {isRegisterMode
          ? "Сохраняйте личную базу слов и статистику в персональной сессии"
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

      {/* Переключатель режимов Вход / Регистрация */}
      <div className={styles.switchModeZone}>
        <button
          type="button"
          className={styles.switchBtn}
          onClick={() => setIsRegisterMode((prev) => !prev)}
        >
          {isRegisterMode
            ? "Уже есть аккаунт? Войти"
            : "Нет аккаунта? Зарегистрироваться"}
        </button>
      </div>

      {/* Декоративный разделитель "Или" */}
      <div className={styles.divider}>
        <span className={styles.dividerText}>Или</span>
      </div>

      {/* Быстрый гостевой старт */}
      <button
        type="button"
        className={styles.guestBtn}
        onClick={loginAsGuest}
        disabled={isLoading}
      >
        🚀 Войти в гостевом режиме (быстрый старт)
      </button>
    </div>
  );
}
