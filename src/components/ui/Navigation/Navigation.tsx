"use client";

import { ActiveTabType } from "@/core/types";
import { useAppDispatch, useAppSelector } from "@/store";
import { setActiveTab } from "@/store/slices/uiSlice";
import { useState } from "react";
import styles from "./Navigation.module.scss";

export default function Navigation() {
  const dispatch = useAppDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeTab = useAppSelector((state) => state.ui.activeTab);
  const words = useAppSelector((state) => state.dictionary.words || []);
  const currentProfile = useAppSelector(
    (state) => state.dictionary.currentProfile || "Основной профиль",
  );

  const handleNavClick = (tab: ActiveTabType) => {
    dispatch(setActiveTab(tab));
  };

  const activeWordsCount = words.filter(
    (word) => word.status !== "learned",
  ).length;

  // Формируем класс для обертки в зависимости от стейта
  const wrapperClassName = `${styles.controlsWrapper} ${isMenuOpen ? styles.open : ""}`;

  // Формируем класс для бургера
  const burgerClassName = `${styles.burger} ${isMenuOpen ? styles.open : ""}`;

  return (
    <div className={wrapperClassName}>
      {/* 🧭 НАВИГАЦИОННАЯ ПАНЕЛЬ */}
      <nav className={styles.nav}>
        <button
          className={`${styles.navButton} ${activeTab === "learn" ? styles.active : ""}`}
          onClick={() => handleNavClick("learn")}
        >
          Изучение
        </button>

        <button
          className={`${styles.navButton} ${activeTab === "add" ? styles.active : ""}`}
          onClick={() => handleNavClick("add")}
        >
          + Слово
        </button>

        <button
          className={`${styles.navButton} ${activeTab === "dictionary" ? styles.active : ""}`}
          onClick={() => handleNavClick("dictionary")}
        >
          Словарь ({activeWordsCount})
        </button>

        <button
          className={`${styles.navButton} ${styles.profileBtn} ${activeTab === "profiles" ? styles.active : ""}`}
          onClick={() => handleNavClick("profiles")}
        >
          👤 <span className={styles.profileTitle}>{currentProfile}</span>
        </button>
      </nav>

      {/* 🍔 БУРГЕР */}
      <button
        className={`${styles.burgerButton} ${isMenuOpen ? styles.active : ""}`}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-label="Переключатель меню"
      >
        <span />
        <span />
        <span />
      </button>
    </div>
  );
}
