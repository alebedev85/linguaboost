"use client";

import AudioPlayButton from "@/components/ui/AudioPlayButton/AudioPlayButton";
import Loader from "@/components/ui/Loader/Loader";
import Image from "next/image";
import { useState } from "react";
import { useTraining } from "../context/TrainingContext";
import styles from "./StageCards.module.scss";

function TrainingImage({ src, alt }: { src: string; alt: string }) {
  // Этот стейт будет автоматически создаваться заново (в значении true)
  // при каждом размонтировании/монтировании компонента по ключу key
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={styles.imageContainer}>
      {isLoading && (
        <div className={styles.imageSkeleton}>
          <Loader />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        className={`${styles.image} ${isLoading ? styles.imageHidden : ""}`}
        width={56}
        height={56}
        unoptimized
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}

export default function StageCards() {
  const { currentWord, handleAnswer } = useTraining();

  if (!currentWord) return null;

  return (
    <div className={styles.innerWrapper}>
      <div className={styles.gridContainer}>
        <div className={styles.imageZone}>
          {currentWord.imageUrl ? (
            /* 
              🔥 Передаем key={currentWord.id} сюда.
              При смене слова React полностью уничтожит старый TrainingImage 
              и создаст новый, сбросив его внутренний стейт isLoading в true!
            */
            <TrainingImage 
              key={currentWord.id} 
              src={currentWord.imageUrl} 
              alt={currentWord.english} 
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <span className={styles.bulbEmoji}>💡</span>
              <span className={styles.placeholderText}>
                Красивая картинка улучшает долгосрочное запоминание
              </span>
            </div>
          )}
        </div>

        <div className={styles.infoZone}>
          <div className={styles.wordHeader}>
            <h3 className={styles.englishWord}>{currentWord.english}</h3>
            <AudioPlayButton
              text={currentWord.english}
              variant="filled"
              size="lg"
            />
          </div>

          <div className={styles.metaGroup}>
            <span className={styles.metaLabel}>Перевод</span>
            <p className={styles.russianWord}>{currentWord.russian}</p>
          </div>

          {currentWord.context && (
            <div className={styles.metaGroup}>
              <span className={styles.metaLabel}>Контекст</span>
              <p className={styles.contextBubble}>
                &quot;{currentWord.context}&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actionsGrid}>
        <button
          onClick={() => handleAnswer(false)}
          className={styles.btnDanger}
        >
          Не помню 😢
        </button>
        <button
          onClick={() => handleAnswer(true)}
          className={styles.btnSuccess}
        >
          Запомнил 👍
        </button>
      </div>
    </div>
  );
}
