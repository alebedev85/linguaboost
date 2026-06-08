import { useForm } from 'react-hook-form';
import styles from './WordForm.module.scss';

export interface WordFormInputs {
  english: string;
  russian: string;
  context?: string;
}

export default function WordForm() {
  const { register, handleSubmit } = useForm<WordFormInputs>();

  // Временный пустой обработчик сабмита, логику добавим позже
  const onSubmit = (data: WordFormInputs) => {
    console.log(data);
  };

  return (
    <div className={styles.formCard}>
      <h2 className={styles.heading}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Новое слово в словарь
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formGroup}>
        {/* Поле: Английское слово */}
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>Слово на английском *</label>
          <div className={styles.inputRow}>
            <input
              type="text"
              required
              placeholder="e.g. Dream"
              {...register('english')}
              className={styles.inputField}
            />
            <button
              type="button"
              className={styles.translateButton}
            >
              🤖 ИИ Перевод
            </button>
          </div>
        </div>

        {/* Поле: Русский перевод */}
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>Перевод на русский *</label>
          <input
            type="text"
            required
            placeholder="Заполнится автоматически через ИИ или введите сами"
            {...register('russian')}
            className={styles.inputField}
          />
        </div>

        {/* Поле: Контекст */}
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>Контекст использования (опционально)</label>
          <textarea
            placeholder="Заполнится автоматически примером или введите свой"
            rows={2}
            {...register('context')}
            className={styles.textareaField}
          />
        </div>

        {/* Блок предупреждения об ИИ-генерации картинок */}
        <div className={styles.infoBlock}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>ИИ Иллюстрация:</strong> Наша система автоматически сгенерирует визуальный образ для этого слова с помощью ИИ Imagen, чтобы задействовать вашу визуальную память при обучении.
          </span>
        </div>

        {/* Кнопка отправки формы */}
        <button type="submit" className={styles.submitButton}>
          Добавить слово в словарь
        </button>
      </form>
    </div>
  );
}