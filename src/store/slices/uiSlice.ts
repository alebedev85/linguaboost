import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Ограничиваем вкладки только валидными значениями из ТЗ
export type ActiveTabType = 'learn' | 'add' | 'dictionary' | 'profiles';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface INotification {
  id: string;
  text: string;
  type: NotificationType;
}

interface UIState {
  activeTab: ActiveTabType;
  notification: INotification | null;
}

const initialState: UIState = {
  activeTab: 'learn', // Вкладка по умолчанию
  notification: null,
};

// Хелпер-санка для автоматического скрытия уведомления через 3 секунды
export const showNotificationWithTimeout = createAsyncThunk(
  'ui/showNotificationWithTimeout',
  async (payload: Omit<INotification, 'id'>, { dispatch }) => {
    const id = crypto.randomUUID();
    
    // Показываем уведомление
    dispatch(setNotification({ ...payload, id }));
    
    // Ждем 3 секунды и скрываем
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    dispatch(clearNotification({ id }));
  }
);

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<ActiveTabType>) => {
      state.activeTab = action.payload;
    },
    setNotification: (state, action: PayloadAction<INotification>) => {
      state.notification = action.payload;
    },
    clearNotification: (state, action: PayloadAction<{ id: string }>) => {
      if (state.notification?.id === action.payload.id) {
        state.notification = null;
      }
    },
  },
});

export const { setActiveTab, setNotification, clearNotification } = uiSlice.actions;
export default uiSlice.reducer;