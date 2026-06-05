"use client";

import { useState } from "react";
import styles from "./WordForm.module.scss";

export default function WordForm() {
  const [english, setEnglish] = useState("");
  const [russian, setRussian] = useState("");
  const [context, setContext] = useState("");

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Добавить новое слово</h2>

      <div className={styles.formGroup}>
        <label className={styles.label}>Слово или фраза (English)</label>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. meticulous"
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
          />
          <button type="button" className={styles.aiButton}>
            ✨ ИИ Перевод
          </button>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Перевод (Русский)</label>
        <input
          type="text"
          className={styles.input}
          placeholder="e.g. дотошный, тщательный"
          value={russian}
          onChange={(e) => setRussian(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Контекст / Пример предложения</label>
        <textarea
          className={styles.textarea}
          placeholder="He was meticulous in his research..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
      </div>

      <button className={styles.submitButton}>Сохранить в словарь</button>
    </div>
  );
}
