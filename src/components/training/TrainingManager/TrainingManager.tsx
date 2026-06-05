'use client';

import React from 'react';
import styles from './TrainingManager.module.scss';

export default function TrainingManager() {
  // Временные стабы для верстки
  const progress = 65; 
  const mockOptions = ['Дотошный', 'Поверхностный', 'Изящный', 'Быстрый'];

  return (
    <div className={styles.wrapper}>
      {/* Прогресс-бар сессии */}
      <div className={styles.progressContainer}>
        <div className={styles.track}>
          <div className={styles.bar} style={{ width: `${progress}%` }}></div>
        </div>
        <span className={styles.progressText}>{progress}%</span>
      </div>

      {/* Игровая карточка */}
      <div className={styles.card}>
        <h2 className={styles.word}>meticulous</h2>
        <p className={styles.context}>Many hours of meticulous preparation were required before the showcase.</p>
        
        {/* Варианты ответов */}
        <div className={styles.grid}>
          {mockOptions.map((option, index) => (
            <button key={index} className={styles.optionButton}>
              {index + 1}. {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}