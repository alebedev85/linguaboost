"use client";

import React, { useState, useEffect } from "react";
import { useTraining } from "../context/TrainingContext";
import { useGeminiTTS } from "@/hooks/useGeminiTTS";
import ActionButton from "@/components/ui/ActionButton/ActionButton";
import styles from "./StageAudioWrite.module.scss";

/**
 * Компонент финального этапа тренировки (Stage 4: Аудирование со свободным вводом).
 * Пользователь воспринимает слово исключительно на слух, вводит его вручную в текстовое поле
 * и имеет перед глазами только ненавязчивую подсказку в виде перевода.
 */
export default function StageAudioWrite() {
  // Извлекаем текущее слово и метод фиксации ответа из глобального контекста тренировки
  const { currentWord, handleAnswer } = useTraining();
  
  // Подключаем кастомный хук для интеграции с API синтеза речи (Text-to-Speech)
  const { speak, isPlaying } = useGeminiTTS();
  
  // Локальное контролируемое состояние для хранения текста, вводимого пользователем
  const [inputValue, setInputValue] = useState("");

  /**
   * Эффект автоматической озвучки слова при старте этапа или переключении на новую карточку.
   * Вызывает внешний сайд-эффект воспроизведения аудио. 
   * Важно: эффект не содержит синхронных вызовов setState (сброс инпута перенесен на уровень JSX через атрибут key),
   * что предотвращает появление каскадных лишних рендеров и удовлетворяет строгим требованиям линтера.
   */
  useEffect(() => {
    if (currentWord) {
      speak(currentWord.english);
    }
  }, [currentWord?.id]); // Реагирует строго на изменение уникального ID слова

  // Защитный хард-гард: предотвращает рендеринг разметки, если данные слова еще не загружены
  if (!currentWord) return null;

  /**
   * Валидация введенного пользователем значения.
   * Приводит строку к нижнему регистру и удаляет лишние пробелы по краям перед сравнением с оригиналом.
   */
  const handleSubmit = () => {
    const trimmedAnswer = inputValue.trim().toLowerCase();
    const isCorrect = trimmedAnswer === currentWord.english.toLowerCase();

    // Явно очищаем локальное поле ввода перед тем, как контекст переключит нас на следующее слово
    setInputValue("");
    // Передаем вердикт правильности в движок провайдера
    handleAnswer(isCorrect, currentWord.english);
  };

  /**
   * Перехватчик нажатия клавиш клавиатуры.
   * Позволяет пользователю мгновенно отправлять ответ по нажатию кнопки 'Enter', не отвлекаясь на клики мышкой.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className={styles.innerWrapper}>
      <div className={styles.container}>
        
        {/* Информационная шапка и большая круглая кнопка повтора аудио */}
        <div className={styles.audioCenter}>
          <span className={styles.label}>Послушайте произношение и запишите слово:</span>
          
          <div className={styles.pulseButtonWrapper}>
            <button
              type="button"
              onClick={() => speak(currentWord.english)}
              disabled={isPlaying}
              className={styles.bigAudioBtn}
              title="Повторить произношение"
            >
              {/* Если аудио проигрывается в данный момент — показываем анимированный лоадер, иначе — иконку звука */}
              {isPlaying ? (
                <span className={styles.spinner} />
              ) : (
                <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              )}
            </button>
          </div>
          
          <p className={styles.hintText}>Нажмите на кнопку выше, чтобы повторить аудио.</p>
        </div>

        {/*
         * КРИТИЧЕСКИЙ АРХИТЕКТУРНЫЙ СЛУЧАЙ:
         * Передача `key={currentWord.id}` заставляет React полностью демонтировать (unmount) и заново смонтировать (mount)
         * этот блок формы каждый раз, когда id слова меняется.
         * Это автоматически сбрасывает локальный стейт `inputValue` в пустую строку "" без использования эффектов
         * и принудительно возвращает автофокус клавиатуры в инпут.
         */}
        <div className={styles.formZone} key={currentWord.id}>
          <input
            type="text"
            placeholder="Введите английское слово..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.audioInput}
            autoFocus // Автоматический фокус при входе на шаг
            autoComplete="off" // Отключаем браузерные подсказки, чтобы не спойлерить ответ
            autoCorrect="off"
            spellCheck="false" // Отключаем встроенную проверку орфографии браузера
          />

          {/* Наш глобальный кастомный UI-компонент кнопки */}
          <ActionButton
            variant="primary"
            fontSize="md"
            onClick={handleSubmit}
            disabled={!inputValue.trim()} // Кнопка блокируется, если поле ввода пустое
            className={styles.submitBtn}
          >
            Ответить
          </ActionButton>
        </div>

        {/* Ненавязчивая подсказка-перевод снизу */}
        <div className={styles.translationTip}>
          <span className={styles.tipBadge}>
            Перевод-подсказка: <strong className={styles.highlight}>{currentWord.russian}</strong>
          </span>
        </div>

      </div>
    </div>
  );
}