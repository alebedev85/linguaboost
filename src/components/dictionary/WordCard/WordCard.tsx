import AudioPlayButton from "@/components/ui/AudioPlayButton/AudioPlayButton";
import { WordImage } from "@/components/ui/WordImage/WordImage";
import { IWord } from "@/core/types";
import { useAppDispatch } from "@/store";
import {
  deleteWordThunk,
  generateAndAttachImageThunk,
  toggleWordStatusThunk,
} from "@/store/slices/dictionarySlice";
import { showNotificationWithTimeout } from "@/store/slices/uiSlice";
import { useState } from "react";
import styles from "./WordCard.module.scss";

interface WordCardProps {
  word: IWord;
}

export default function WordCard({ word }: WordCardProps) {
  const dispatch = useAppDispatch();
  // Локальный стейт для индикации загрузки конкретной картинки
  const [isGenerating, setIsGenerating] = useState(false);

  // Обработчик генерации изображения для готового слова
  const handleGenerateImage = async () => {
    if (!word.id) return;

    setIsGenerating(true);
    dispatch(
      showNotificationWithTimeout({
        text: `Запущена генерация изображения для "${word.english}"...`,
        type: "info",
      }),
    );

    try {
      // unwrap() позволяет обработать результат thunk-а прямо в блоке try/catch
      await dispatch(
        generateAndAttachImageThunk({
          wordId: word.id,
          english: word.english,
          russian: word.russian,
        }),
      ).unwrap();

      dispatch(
        showNotificationWithTimeout({
          text: `Изображение для "${word.english}" успешно создано!`,
          type: "success",
        }),
      );
    } catch (error: any) {
      dispatch(
        showNotificationWithTimeout({
          text: error || "Не удалось сгенерировать изображение",
          type: "error",
        }),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Обработчик изменения статуса (Изучено / Сбросить)
  const handleToggleStatus = () => {
    dispatch(toggleWordStatusThunk(word.id));

    const isNowLearned = word.status !== "learned";
    dispatch(
      showNotificationWithTimeout({
        text: isNowLearned
          ? `Отлично! Слово "${word.english}" перенесено в изученные.`
          : `Статус слова "${word.english}" сброшен.`,
        type: isNowLearned ? "success" : "info",
      }),
    );
  };

  // Обработчик удаления карточки слова
  const handleDeleteWord = () => {
    dispatch(deleteWordThunk(word.id));
    dispatch(
      showNotificationWithTimeout({
        text: `Слово "${word.english}" удалено из словаря`,
        type: "error",
      }),
    );
  };

  return (
    <div className={styles.wordCard}>
      {/* Прогресс-бар сверху */}
      <div
        className={styles.progressBar}
        style={{ width: `${word.progress || 0}%` }}
      />

      <div className={styles.cardTop}>
        <div className={styles.wordInfo}>
          <div className={styles.wordHeader}>
            <h3 className={styles.englishText}>{word.english}</h3>
            <AudioPlayButton text={word.english} />
          </div>
          <p className={styles.russianText}>{word.russian}</p>
        </div>

        <WordImage
          imageUrl={word.imageUrl}
          englishWord={word.english}
          isGenerating={isGenerating}
          onGenerate={handleGenerateImage}
        />
      </div>

      {word.context && (
        <p className={styles.contextBlock}>&quot;{word.context}&quot;</p>
      )}

      {/* Футер карточки с экшенами управления */}
      <div className={styles.cardFooter}>
        <div className={styles.statusIndicator}>
          <span
            className={`${styles.dot} ${
              word.status === "learned"
                ? styles.mastered
                : word.status === "learning"
                  ? styles.learning
                  : styles.new
            }`}
          />
          <span className={styles.statusText}>
            {word.status === "learned" && "Изучено"}
            {word.status === "learning" && `Освоено ${word.progress || 0}%`}
            {word.status === "new" && "Новое слово"}
          </span>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleToggleStatus}
            className={`${styles.toggleButton} ${word.status === "learned" ? styles.reset : styles.complete}`}
          >
            {word.status === "learned" ? "Сбросить" : "Уже изучено"}
          </button>
          <button
            type="button"
            onClick={handleDeleteWord}
            className={styles.deleteButton}
            title="Удалить слово"
          >
            <svg
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
