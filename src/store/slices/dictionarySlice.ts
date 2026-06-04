import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IWord } from '@/core/types';

interface DictionaryState {
  words: IWord[];
  profiles: string[];
  currentProfile: string;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: DictionaryState = {
  words: [],
  profiles: ['Основной профиль'],
  currentProfile: 'Основной профиль',
  status: 'idle',
};

const dictionarySlice = createSlice({
  name: 'dictionary',
  initialState,
  reducers: {
    setWords: (state, action: PayloadAction<IWord[]>) => {
      state.words = action.payload;
    },
    setProfilesData: (state, action: PayloadAction<{ list: string[]; current: string }>) => {
      state.profiles = action.payload.list;
      state.currentProfile = action.payload.current;
    },
    changeProfile: (state, action: PayloadAction<string>) => {
      state.currentProfile = action.payload;
    }
  },
});

export const { setWords, setProfilesData, changeProfile } = dictionarySlice.actions;
export default dictionarySlice.reducer;