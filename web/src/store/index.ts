import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import dashboardSlice from './slices/dashboardSlice';
import expensesSlice from './slices/expensesSlice';
import staffSlice from './slices/staffSlice';
import customersSlice from './slices/customersSlice';
import reportsSlice from './slices/reportsSlice';
import vehiclesSlice from './slices/vehiclesSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    dashboard: dashboardSlice,
    expenses: expensesSlice,
    staff: staffSlice,
    customers: customersSlice,
    reports: reportsSlice,
    vehicles: vehiclesSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;