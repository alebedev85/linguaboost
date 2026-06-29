import React from "react";
import Image from "next/image";
import Loader from "@/components/ui/Loader/Loader";
import styles from "./WordImage.module.scss";

interface WordImageProps {
  imageUrl?: string | null;
  englishWord: string;
  isGenerating: boolean;
  onGenerate: () => void;
}

export const WordImage: React.FC<WordImageProps> = ({
  imageUrl,
  englishWord,
  isGenerating,
  onGenerate,
}) => {
  if (imageUrl) {
    return (
      <div className={styles.imageWrapper}>
        <Image
          src={imageUrl}
          alt={englishWord}
          className={`${styles.cardImg} ${isGenerating ? styles.generatingBlur : ""}`}
          width={48}
          height={48}
          unoptimized
        />

        {/* Кнопка повторной генерации при ховере */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className={styles.regenerateBtn}
          title="Перегенерировать изображение с помощью ИИ"
        >
          {isGenerating ? (
            <Loader />
          ) : (
            <>
              <span className={styles.bulbEmoji}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
                  <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
                </svg>
              </span>
              <span className={styles.regenerateBtnText}>
                Сгенерировать еще раз
              </span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onGenerate}
      disabled={isGenerating}
      className={`${styles.imagePlaceholder} ${isGenerating ? styles.generating : ""}`}
      title="Сгенерировать изображение с помощью ИИ"
    >
      {isGenerating ? (
        <Loader />
      ) : (
        <>
          <span className={styles.bulbEmoji}>💡</span>
          <span className={styles.placeholderText}>
            Сгенерировать картинку
          </span>
        </>
      )}
    </button>
  );
};