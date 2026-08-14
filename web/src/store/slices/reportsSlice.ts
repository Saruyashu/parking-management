import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

interface ReportsState {
  report: any;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  report: null,
  isLoading: false,
  error: null,
};

export const fetchMonthlyReport = createAsyncThunk(
  'reports/fetchMonthly',
  async ({ month, year }: { month: number; year: number }) => {
    const response = await api.getMonthlyReport(month, year);
    return response;
  }
);

export const fetchDailyReport = createAsyncThunk(
  'reports/fetchDaily',
  async (date?: string) => {
    const response = await api.getDailyReport(date);
    return response;
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonthlyReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMonthlyReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.report = action.payload;
      })
      .addCase(fetchDailyReport.fulfilled, (state, action) => {
        state.report = action.payload;
      });
  },
});

export default reportsSlice.reducer;