"use client";

import React from "react";
import styles from "./TrainingLayout.module.scss";

export interface IWord {
  id: string;
  english: string;
  russian: string;
  context?: string;
}

export interface ITrainingSession {
  stage: number;
  words: IWord[];
  wordStates: {
    [wordId: string]: {
      [stageKey: string]: boolean;
    };
  };
}

export interface IFeedback {
  type: "success" | "error";
  msg: string;
  correct?: string;
}

interface TrainingLayoutProps {
  trainingSession: ITrainingSession;
  currentWordIndex: number;
  trainingFeedback: IFeedback | null;
  children: React.ReactNode;
}

export default function TrainingLayout({
  trainingSession,
  currentWordIndex,
  trainingFeedback,
  children,
}: TrainingLayoutProps) {
  return (
    <div className={styles.container}>
      {/* Блок 1: Статус этапов тренировки */}
      <div className={styles.stageStatusCard}>
        <div className={styles.stageInfo}>
          <div className={styles.stageBadge}>Этап {trainingSession.stage} из 4</div>
          <span className={styles.stageText}>
            {trainingSession.stage === 1 && "🧠 Карточки: Запоминание"}
            {trainingSession.stage === 2 && "⚡️ Тест: Выбор правильного слова"}
            {trainingSession.stage === 3 && "🧩 Конструктор: Сборка из букв"}
            {trainingSession.stage === 4 && "🎧 Аудирование: Написание на слух"}
          </span>
        </div>

        <div className={styles.stageDots}>
          {[1, 2, 3, 4].map((stg) => (
            <div
              key={stg}
              className={`${styles.stageDot} ${
                trainingSession.stage === stg
                  ? styles.active
                  : trainingSession.stage > stg
                  ? styles.passed
                  : ""
              }`}
            />
          ))}
        </div>
      </div>

      {/* Блок 2: Прогресс слов текущего этапа */}
      <div className={styles.progressCard}>
        <span className={styles.progressLabel}>Прогресс текущего этапа:</span>
        <div className={styles.wordBars}>
          {trainingSession.words.map((w, idx) => {
            const passed = trainingSession.wordStates[w.id][`stage${trainingSession.stage}Passed`];
            const isCurrent = idx === currentWordIndex;
            return (
              <div
                key={w.id}
                className={`${styles.wordBar} ${passed ? styles.passed : isCurrent ? styles.current : ""}`}
                title={w.english}
              />
            );
          })}
        </div>
        <span className={styles.progressCounter}>
          {currentWordIndex + 1}/{trainingSession.words.length}
        </span>
      </div>

      {/* Блок 3: Контейнер тренировки + Оверлей обратной связи */}
      <div className={styles.mainContentCard}>
        {trainingFeedback && (
          <div
            className={`${styles.feedbackOverlay} ${
              trainingFeedback.type === "success" ? styles.success : styles.error
            }`}
          >
            <div className={styles.feedbackEmoji}>
              {trainingFeedback.type === "success" ? "🎉" : "❌"}
            </div>
            <h3 className={styles.feedbackMsg}>{trainingFeedback.msg}</h3>
            
            {trainingFeedback.correct && (
              <div className={styles.correctBlock}>
                <p className={styles.correctLabel}>Правильный ответ:</p>
                <p className={styles.correctWord}>{trainingFeedback.correct}</p>
              </div>
            )}
            
            {trainingFeedback.type === "error" && !trainingFeedback.correct && (
              <p className={styles.feedbackHint}>
                Слово вернется в начало круга на текущем этапе.
              </p>
            )}
          </div>
        )}

        {/* Сюда рендерится сам компонент этапа (например, StageCards) */}
        {children}
      </div>
    </div>
  );
}