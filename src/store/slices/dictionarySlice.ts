import { db } from "@/core/firebase";
import { aiService } from "@/core/services/aiService";
import { uploadWordImage } from "@/core/supabase";
import { IWord } from "@/core/types";
import { RootState } from "@/store";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { showNotificationWithTimeout } from "./uiSlice";

interface DictionaryState {
  words: IWord[];
  profiles: string[];
  currentProfile: string;
  status: "idle" | "loading" | "failed";
}

interface WordTrainingResult {
  wordId: string;
  action: "upgrade" | "keep" | "downgrade";
}

export interface SaveWordPayload {
  english: string;
  russian: string;
  context: string;
  needImage?: boolean;
  visualPrompt?: string | undefined;
}

export interface SaveWordResponse extends IWord {
  isImageFailed: boolean;
}

export interface GenerateImageForExistingWordPayload {
  wordId: string;
  english: string;
  visualPrompt: string | undefined;
}

/**
 * 📥 1. САНК ЗАГРУЗКИ ВСЕХ СЛОВ ПОЛЬЗОВАТЕЛЯ
 */
export const fetchWordsThunk = createAsyncThunk<
  IWord[],
  void,
  { state: RootState }
>(
  "dictionary/fetchWords",
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.uid;

      if (!userId) {
        throw new Error("Пользователь не авторизован");
      }

      const wordsCollection = collection(db, "words");
      const q = query(wordsCollection, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const words: IWord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        words.push({
          id: doc.id,
          english: data.english,
          russian: data.russian,
          context: data.context,
          imageUrl: data.imageUrl,
          progress: data.progress,
          status: data.status,
          createdAt: data.createdAt,
          visualPrompt: data.visualPrompt,
        } as IWord);
      });

      // Сортируем: сначала новые
      return words.sort((a, b) => {
        const getTime = (date: any): number => {
          if (!date) return 0;
          // Если это Firebase Timestamp (у него есть метод toDate)
          if (typeof date.toDate === "function") {
            return date.toDate().getTime();
          }
          // Если это строка (ISO) или объект Date
          return new Date(date).getTime();
        };

        return getTime(b.createdAt) - getTime(a.createdAt);
      });
    } catch (error: any) {
      dispatch(
        showNotificationWithTimeout({
          text: "Не удалось загрузить словарь",
          type: "error",
        }),
      );
      return rejectWithValue(error.message || "Ошибка загрузки данных");
    }
  },
);

/**
 * 🚀 2. САНК СОХРАНЕНИЯ СЛОВА
 */
export const saveWordThunk = createAsyncThunk<
  SaveWordResponse,
  SaveWordPayload,
  { state: RootState }
>(
  "dictionary/saveWord",
  async (payload, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.uid;

      if (!userId) {
        throw new Error("Пользователь не авторизован");
      }

      let firestoreImageUrl = "";
      let isImageFailed = false;

      if (payload.needImage) {
        try {
          const promptForFlux = payload.visualPrompt || payload.english;
          const base64Data = await aiService.getImageForWord(promptForFlux);

          if (base64Data) {
            const sanitizedFileName = payload.english
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "_");

            firestoreImageUrl = await uploadWordImage(
              base64Data,
              sanitizedFileName,
            );
          } else {
            isImageFailed = true;
          }
        } catch (imgError) {
          console.warn("⚠️ Картинка не сгенерировалась:", imgError);
          isImageFailed = true;
        }
      }

      const newWordData = {
        userId,
        english: payload.english.trim(),
        russian: payload.russian.trim(),
        context: payload.context.trim(),
        visualPrompt: payload.visualPrompt,
        imageUrl: firestoreImageUrl,
        progress: 0,
        status: "learning" as const,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "words"), newWordData);

      dispatch(
        showNotificationWithTimeout({
          text: isImageFailed
            ? "Слово добавлено, но картинка не сгенерировалась"
            : "Слово успешно добавлено!",
          type: isImageFailed ? "warning" : "success",
        }),
      );

      return {
        id: docRef.id,
        ...newWordData,
        isImageFailed,
      };
    } catch (error: any) {
      dispatch(
        showNotificationWithTimeout({
          text: "Не удалось сохранить слово",
          type: "error",
        }),
      );
      return rejectWithValue(error.message || "Не удалось сохранить слово");
    }
  },
);

/**
 * 🗑️ 3. САНК УДАЛЕНИЯ СЛОВА
 */
export const deleteWordThunk = createAsyncThunk<
  string, // Возвращает id удаленного слова
  string, // Принимает id слова
  { state: RootState }
>("dictionary/deleteWord", async (wordId, { rejectWithValue, dispatch }) => {
  try {
    const wordDocRef = doc(db, "words", wordId);
    await deleteDoc(wordDocRef);

    dispatch(
      showNotificationWithTimeout({ text: "Слово удалено", type: "info" }),
    );
    return wordId;
  } catch (error: any) {
    dispatch(
      showNotificationWithTimeout({
        text: "Ошибка при удалении слова",
        type: "error",
      }),
    );
    return rejectWithValue(error.message);
  }
});

/**
 * 🔄 4. САНК ПЕРЕКЛЮЧЕНИЯ СТАТУСА (Изучено / Учу)
 */
export const toggleWordStatusThunk = createAsyncThunk<
  { wordId: string; status: "learning" | "learned"; progress: number },
  string,
  { state: RootState }
>(
  "dictionary/toggleWordStatus",
  async (wordId, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as RootState;
      const word = state.dictionary.words.find((w) => w.id === wordId);

      if (!word) throw new Error("Слово не найдено в стейте");

      const newStatus = word.status === "learned" ? "learning" : "learned";
      const newProgress = newStatus === "learned" ? 100 : 0;

      const wordDocRef = doc(db, "words", wordId);
      await updateDoc(wordDocRef, {
        status: newStatus,
        progress: newProgress,
      });

      return { wordId, status: newStatus, progress: newProgress };
    } catch (error: any) {
      dispatch(
        showNotificationWithTimeout({
          text: "Не удалось обновить статус",
          type: "error",
        }),
      );
      return rejectWithValue(error.message);
    }
  },
);

/**
 * 🏋️‍♂️ 5. САНК ЗАВЕРШЕНИЯ ТРЕНИРОВКИ СЛОВ
 */
export const finishTrainingWordsThunk = createAsyncThunk<
  WordTrainingResult[],
  WordTrainingResult[],
  { state: RootState }
>(
  "dictionary/finishTrainingWords",
  async (results, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as RootState;

      // Асинхронно обновляем каждое слово в Firestore
      const promises = results.map(async (res) => {
        const word = state.dictionary.words.find((w) => w.id === res.wordId);
        if (!word) return;

        const currentProgress = word.progress || 0;
        let newProgress = currentProgress;

        if (res.action === "upgrade") newProgress = currentProgress + 25;
        if (res.action === "downgrade") newProgress = currentProgress - 25;

        newProgress = Math.max(0, Math.min(100, newProgress));
        const newStatus = newProgress >= 100 ? "learned" : "learning";

        const wordDocRef = doc(db, "words", res.wordId);
        await updateDoc(wordDocRef, {
          progress: newProgress,
          status: newStatus,
        });
      });

      await Promise.all(promises);

      dispatch(
        showNotificationWithTimeout({
          text: "Результаты тренировки сохранены!",
          type: "success",
        }),
      );
      return results;
    } catch (error: any) {
      dispatch(
        showNotificationWithTimeout({
          text: "Ошибка сохранения прогресса тренировки",
          type: "error",
        }),
      );
      return rejectWithValue(error.message);
    }
  },
);

/**
 * 🖼️ 6. САНК ГЕНЕРАЦИИ КАРТИНКИ К СУЩЕСТВУЮЩЕМУ СЛОВУ
 */
export const generateAndAttachImageThunk = createAsyncThunk<
  { wordId: string; imageUrl: string },
  GenerateImageForExistingWordPayload,
  { state: RootState }
>(
  "dictionary/generateAndAttachImage",
  async ({ wordId, english, visualPrompt }, { rejectWithValue, dispatch }) => {
    // console.log(visualPrompt);
    try {
      const base64Data = await aiService.getImageForWord(visualPrompt? visualPrompt : english);

      if (!base64Data) throw new Error("ИИ вернул пустой ответ");

      const sanitizedFileName =
        english
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_") + `_${Date.now()}`;

      const firestoreImageUrl = await uploadWordImage(
        base64Data,
        sanitizedFileName,
      );

      if (!firestoreImageUrl) throw new Error("Ошибка загрузки в Supabase");

      const wordDocRef = doc(db, "words", wordId);
      await updateDoc(wordDocRef, { imageUrl: firestoreImageUrl });

      dispatch(
        showNotificationWithTimeout({
          text: "Иллюстрация успешно создана!",
          type: "success",
        }),
      );
      return { wordId, imageUrl: firestoreImageUrl };
    } catch (error: any) {
      dispatch(
        showNotificationWithTimeout({
          text: "Не удалось сгенерировать картинку",
          type: "error",
        }),
      );
      return rejectWithValue(error.message);
    }
  },
);

const initialState: DictionaryState = {
  words: [], // Изначально пустой массив, данные тянем из бэка
  profiles: ["Основной профиль"],
  currentProfile: "Основной профиль",
  status: "idle",
};

const dictionarySlice = createSlice({
  name: "dictionary",
  initialState,
  reducers: {
    addProfile: (state, action: PayloadAction<string>) => {
      const newProfile = action.payload.trim();
      if (newProfile && !state.profiles.includes(newProfile)) {
        state.profiles.push(newProfile);
        state.currentProfile = newProfile;
        state.words = [];
      }
    },
    changeProfile: (state, action: PayloadAction<string>) => {
      state.currentProfile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Кейсы загрузки слов
      .addCase(fetchWordsThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchWordsThunk.fulfilled, (state, action) => {
        state.status = "idle";
        state.words = action.payload;
      })
      .addCase(fetchWordsThunk.rejected, (state) => {
        state.status = "failed";
      })

      // Кейсы добавления нового слова
      .addCase(saveWordThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(
        saveWordThunk.fulfilled,
        (state, action: PayloadAction<SaveWordResponse>) => {
          state.status = "idle";
          const { isImageFailed, ...pureWord } = action.payload;
          state.words.unshift(pureWord);
        },
      )
      .addCase(saveWordThunk.rejected, (state) => {
        state.status = "failed";
      })

      // Кейсы удаления слова
      .addCase(deleteWordThunk.fulfilled, (state, action) => {
        state.words = state.words.filter((word) => word.id !== action.payload);
      })

      // Кейсы переключения статуса слова
      .addCase(toggleWordStatusThunk.fulfilled, (state, action) => {
        const { wordId, status, progress } = action.payload;
        const word = state.words.find((w) => w.id === wordId);
        if (word) {
          word.status = status;
          word.progress = progress;
        }
      })

      // Кейсы завершения тренировки
      .addCase(finishTrainingWordsThunk.fulfilled, (state, action) => {
        const resultsMap = new Map(
          action.payload.map((res) => [res.wordId, res.action]),
        );

        state.words.forEach((word) => {
          if (resultsMap.has(word.id)) {
            const trainingAction = resultsMap.get(word.id);
            const currentProgress = word.progress || 0;
            let newProgress = currentProgress;

            if (trainingAction === "upgrade")
              newProgress = currentProgress + 25;
            if (trainingAction === "downgrade")
              newProgress = currentProgress - 25;

            word.progress = Math.max(0, Math.min(100, newProgress));
            word.status = word.progress >= 100 ? "learned" : "learning";
          }
        });
      })

      // Кейсы для добавления картинки к существующему слову
      .addCase(generateAndAttachImageThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(generateAndAttachImageThunk.fulfilled, (state, action) => {
        state.status = "idle";
        const { wordId, imageUrl } = action.payload;
        const word = state.words.find((w) => w.id === wordId);
        if (word) {
          word.imageUrl = imageUrl;
        }
      })
      .addCase(generateAndAttachImageThunk.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export const { addProfile, changeProfile } = dictionarySlice.actions;
export default dictionarySlice.reducer;
