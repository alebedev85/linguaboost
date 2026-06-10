"use client";

import { useTraining } from "../context/TrainingContext";
import styles from "./StageCards.module.scss";

export default function StageCards() {
  const { currentWord, handleAnswer } = useTraining();

  if (!currentWord) return null;

  return (
    <div className={styles.innerWrapper}>
      <div className={styles.gridContainer}>
        <div className={styles.imageZone}>
          <div className={styles.imagePlaceholder}>
            <span className={styles.bulbEmoji}>💡</span>
            <span className={styles.placeholderText}>
              Красивая картинка улучшает долгосрочное запоминание
            </span>
          </div>
        </div>

        <div className={styles.infoZone}>
          <div className={styles.wordHeader}>
            <h3 className={styles.englishWord}>{currentWord.english}</h3>
            <button className={styles.audioBtn} title="Послушать произношение">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </div>

          <div className={styles.metaGroup}>
            <span className={styles.metaLabel}>Перевод</span>
            <p className={styles.russianWord}>{currentWord.russian}</p>
          </div>

          {currentWord.context && (
            <div className={styles.metaGroup}>
              <span className={styles.metaLabel}>Контекст</span>
              <p className={styles.contextBubble}>&quot;{currentWord.context}&quot;</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actionsGrid}>
        <button onClick={() => handleAnswer(false)} className={styles.btnDanger}>
          Не помню 😢
        </button>
        <button onClick={() => handleAnswer(true)} className={styles.btnSuccess}>
          Запомнил 👍
        </button>
      </div>
    </div>
  );
}