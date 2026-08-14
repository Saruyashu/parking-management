import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

interface DashboardState {
  overview: any;
  recentActivity: any[];
  trend: { days: number; data: any[] };
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  overview: null,
  recentActivity: [],
  trend: { days: 30, data: [] },
  isLoading: false,
  error: null,
};

export const fetchOverview = createAsyncThunk('dashboard/fetchOverview', async () => {
  const response = await api.getOverview();
  return response;
});

export const fetchRecentActivity = createAsyncThunk('dashboard/fetchActivity', async () => {
  const response = await api.getRecentActivity();
  return response;
});

export const fetchTrend = createAsyncThunk<any, any>('dashboard/fetchTrend', async (days: any = 30) => {
  const response = await api.getTrend(days);
  return response;
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overview = action.payload;
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch overview';
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.recentActivity = action.payload;
      })
      .addCase(fetchTrend.fulfilled, (state, action) => {
        state.trend = action.payload;
      });
  },
});

export default dashboardSlice.reducer;