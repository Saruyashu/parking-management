import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import slotsSlice from './slices/slotsSlice';
import vehiclesSlice from './slices/vehiclesSlice';
import expensesSlice from './slices/expensesSlice';
import staffSlice from './slices/staffSlice';
import dashboardSlice from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    slots: slotsSlice,
    vehicles: vehiclesSlice,
    expenses: expensesSlice,
    staff: staffSlice,
    dashboard: dashboardSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;