"use client";

import React, { createContext, useContext, useState } from "react";
import { IWord, ITrainingSession, ITrainingFeedback } from "@/core/types"; 

/**
 * Описание интерфейса контекста тренировки.
 * Определяет, какие данные и методы будут доступны всем дочерним компонентам на любой глубине.
 */
interface TrainingContextType {
  trainingSession: ITrainingSession | null; // Текущая сессия (данные этапа, список слов, прогресс каждого слова)
  currentWordIndex: number;                 // Индекс (ID позиции) текущего тестируемого слова в массиве сессии
  trainingFeedback: ITrainingFeedback | null; // Состояние оверлея обратной связи (успех/ошибка, правильный ответ)
  currentWord: IWord | null;                // Вычисляемый геттер для быстрого доступа к текущему слову
  startTraining: (words: IWord[]) => void;  // Метод инициализации и старта тренировочной сессии
  handleAnswer: (isCorrect: boolean, correctAnswer?: string) => void; // Метод обработки ответа пользователя
}

// Создаем изолированный контекст. Дефолтное значение undefined защищает от использования контекста вне провайдера.
const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

/**
 * Провайдер состояния тренировки (Управляющий компонент архитектуры).
 * Инкапсулирует в себе всю бизнес-логику шагов, таймеров и валидации ответов.
 */
export function TrainingProvider({ children }: { children: React.ReactNode }) {
  // Основные реактивные состояния сессии
  const [trainingSession, setTrainingSession] = useState<ITrainingSession | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [trainingFeedback, setTrainingFeedback] = useState<ITrainingFeedback | null>(null);

  /**
   * Запуск новой сессии тренировки.
   * Принимает отфильтрованный пакет слов (например, 6 штук из Redux / Firestore).
   */
  const startTraining = (wordsToTrain: IWord[]) => {
    const initialWordStates: ITrainingSession["wordStates"] = {};
    
    // Формируем чистую карту прохождения этапов для каждого слова сессии
    wordsToTrain.forEach((w) => {
      initialWordStates[w.id] = {
        stage1Passed: false,
        stage2Passed: false,
        stage3Passed: false,
        stage4Passed: false,
      };
    });

    // Записываем сессию в стейт: сбрасываем на 1 этап и передаем подготовленные данные
    setTrainingSession({
      stage: 1,
      words: wordsToTrain,
      wordStates: initialWordStates,
    });
    
    // Сбрасываем указатель текущего слова на начало массива
    setCurrentWordIndex(0);
  };

  /**
   * Универсальный обработчик ответа пользователя (для всех типов тренировок Stage*).
   * @param isCorrect - зафиксирован ли правильный ответ/успешное запоминание
   * @param correctAnswer - опциональная строка с правильным ответом (нужна для вывода работы над ошибками)
   */
  const handleAnswer = (isCorrect: boolean, correctAnswer?: string) => {
    if (!trainingSession) return;

    // Определяем текущее слово и динамический ключ текущего этапа (например, 'stage1Passed')
    const currentWord = trainingSession.words[currentWordIndex];
    const stageKey = `stage${trainingSession.stage}Passed` as keyof typeof trainingSession.wordStates[string];

    // Иммутабельно обновляем состояние прохождения текущего этапа для конкретного слова
    const updatedWordStates = {
      ...trainingSession.wordStates,
      [currentWord.id]: {
        ...trainingSession.wordStates[currentWord.id],
        [stageKey]: isCorrect,
      },
    };

    // Сохраняем обновленную карту прогресса слов в стейт сессии
    setTrainingSession({
      ...trainingSession,
      wordStates: updatedWordStates,
    });

    // Включаем полноэкранный оверлей фидбека (компонент Layout поймает это состояние и покажет плашку)
    setTrainingFeedback(
      isCorrect
        ? { type: "success", msg: "Отлично запомнили!" }
        : { type: "error", msg: "Ничего, повторим еще раз!", correct: correctAnswer }
    );

    // Запускаем искусственную задержку в 1.2 сек, чтобы пользователь успел считать фидбек
    setTimeout(() => {
      // Гасим оверлей обратной связи
      setTrainingFeedback(null);

      // Проверяем, остались ли еще слова внутри текущего этапа
      if (currentWordIndex < trainingSession.words.length - 1) {
        // Переходим к следующему слову в массиве
        setCurrentWordIndex((prev) => prev + 1);
      } else {
        // Текущий круг слов завершен. Сюда позже встанет логика инкремента этапа (stage + 1)
        alert("Этап завершен!");
        setTrainingSession(null); // Временно сбрасываем сессию (возврат на стартовый экран)
      }
    }, 1200); // 1200ms идеально сбалансировано под CSS-анимацию оверлея
  };

  // Вычисляемое свойство (производный стейт). Избавляет дочерние компоненты от ручного поиска текущего слова по индексу.
  const currentWord = trainingSession ? trainingSession.words[currentWordIndex] : null;

  return (
    <TrainingContext.Provider
      value={{
        trainingSession,
        currentWordIndex,
        trainingFeedback,
        currentWord,
        startTraining,
        handleAnswer,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}

/**
 * Кастомный хук для безопасного доступа к контексту тренировки.
 * Избавляет от необходимости писать useContext(TrainingContext) в каждом компоненте.
 */
export function useTraining() {
  const context = useContext(TrainingContext);
  // Если хук вызван вне дерева <TrainingProvider>, TypeScript сразу выбросит понятную ошибку в рантайме
  if (!context) {
    throw new Error("useTraining должен использоваться внутри TrainingProvider");
  }
  return context;
}