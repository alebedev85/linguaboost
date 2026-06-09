"use client";

import { useState } from "react";
import TrainingWelcome from "@/components/training/TrainingWelcome/TrainingWelcome";
import TrainingLayout, { ITrainingSession, IFeedback } from "@/components/training/TrainingLayout/TrainingLayout";
import StageCards from "@/components/training/StageCards/StageCards";
import styles from "./TrainingManager.module.scss";

const MOCK_WORDS = [
  { id: "1", english: "Galaxy", russian: "Галактика", context: "Our galaxy is huge." },
  { id: "2", english: "Spaceship", russian: "Космический корабль", context: "The spaceship landed safely." },
  { id: "3", english: "Orbit", russian: "Орбита", context: "The satellite is in orbit." },
];

export default function TrainingManager() {
  const [trainingSession, setTrainingSession] = useState<ITrainingSession | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [trainingFeedback, setTrainingFeedback] = useState<IFeedback | null>(null);

  const startTraining = () => {
    // Формируем начальные состояния прохождения этапов для каждого слова
    const initialWordStates: ITrainingSession["wordStates"] = {};
    MOCK_WORDS.forEach((w) => {
      initialWordStates[w.id] = {
        stage1Passed: false,
        stage2Passed: false,
        stage3Passed: false,
        stage4Passed: false,
      };
    });

    setTrainingSession({
      stage: 1,
      words: MOCK_WORDS,
      wordStates: initialWordStates,
    });
    setCurrentWordIndex(0);
  };

  const handleCardAnswer = (remembered: boolean) => {
    if (!trainingSession) return;

    const currentWord = trainingSession.words[currentWordIndex];

    // Обновляем статус прохождения первого этапа для текущего слова
    const updatedWordStates = {
      ...trainingSession.wordStates,
      [currentWord.id]: {
        ...trainingSession.wordStates[currentWord.id],
        stage1Passed: remembered,
      },
    };

    // Обновляем сессию в стейте
    setTrainingSession({
      ...trainingSession,
      wordStates: updatedWordStates,
    });

    // Запускаем анимацию фидбека
    setTrainingFeedback(
      remembered 
        ? { type: "success", msg: "Отлично запомнили!" } 
        : { type: "error", msg: "Ничего, повторим еще раз!" }
    );

    // Через секунду убираем фидбек и двигаем очередь вперед
    setTimeout(() => {
      setTrainingFeedback(null);

      if (currentWordIndex < trainingSession.words.length - 1) {
        setCurrentWordIndex((prev) => prev + 1);
      } else {
        alert("Первый этап полностью пройден!");
        setTrainingSession(null);
      }
    }, 1200);
  };

  return (
    <div className={styles.wrapper}>
      {!trainingSession ? (
        <TrainingWelcome
          currentProfile="Английский для начинающих"
          startTraining={startTraining}
        />
      ) : (
        <TrainingLayout
          trainingSession={trainingSession}
          currentWordIndex={currentWordIndex}
          trainingFeedback={trainingFeedback}
        >
          {trainingSession.stage === 1 && (
            <StageCards
              word={trainingSession.words[currentWordIndex]}
              onAnswer={handleCardAnswer}
            />
          )}
        </TrainingLayout>
      )}
    </div>
  );
}