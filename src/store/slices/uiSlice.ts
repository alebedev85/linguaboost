import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Ограничиваем вкладки только валидными значениями из ТЗ
export type ActiveTabType = 'learn' | 'add' | 'dictionary' | 'profiles';

interface UIState {
  activeTab: ActiveTabType;
}

const initialState: UIState = {
  activeTab: 'learn', // Вкладка по умолчанию
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<ActiveTabType>) => {
      state.activeTab = action.payload;
    },
  },
});

export const { setActiveTab } = uiSlice.actions;
export default uiSlice.reducer;