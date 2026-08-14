import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as api from '../../services/api';

interface DashboardOverview {
  today: {
    revenue: number;
    revenueChange: number;
    activeVehicles: number;
    pendingExpenses: number;
  };
  month: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: string;
  };
  occupancy: {
    current: number;
    total: number;
    percent: number;
  };
  alerts: {
    expiringPasses: number;
  };
}

interface Activity {
  id: string;
  type: 'expense' | 'vehicle';
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  time: string;
}

interface DashboardState {
  overview: DashboardOverview | null;
  recentActivity: Activity[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  overview: null,
  recentActivity: [],
  isLoading: false,
  error: null,
};

export const fetchDashboardOverview = createAsyncThunk('dashboard/fetchOverview', async () => {
  const response = await api.getDashboardOverview();
  return response;
});

export const fetchRecentActivity = createAsyncThunk('dashboard/fetchActivity', async () => {
  const response = await api.getRecentActivity();
  return response;
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setOverview: (state, action: PayloadAction<DashboardOverview>) => {
      state.overview = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overview = action.payload;
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch dashboard';
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.recentActivity = action.payload;
      });
  },
});

export const { setOverview } = dashboardSlice.actions;
export default dashboardSlice.reducer;