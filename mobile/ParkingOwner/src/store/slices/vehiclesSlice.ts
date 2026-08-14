import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as api from '../../services/api';

interface VehicleLog {
  id: string;
  vehicle_number: string;
  category: string;
  entry_time: string;
  exit_time?: string;
  duration_minutes?: number;
  total_amount: number;
  gst_amount: number;
  payment_mode?: string;
  payment_status: string;
  slot: { slot_number: string; zone: { name: string } };
}

interface VehiclesState {
  activeVehicles: VehicleLog[];
  activeCount: number;
  vehicleLogs: VehicleLog[];
  currentEntry: VehicleLog | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: VehiclesState = {
  activeVehicles: [],
  activeCount: 0,
  vehicleLogs: [],
  currentEntry: null,
  isLoading: false,
  error: null,
};

export const fetchActiveVehicles = createAsyncThunk('vehicles/fetchActive', async () => {
  const response = await api.getActiveVehicles();
  return response;
});

export const logEntry = createAsyncThunk(
  'vehicles/logEntry',
  async (data: { slot_id: string; vehicle_number: string; category: string }) => {
    const response = await api.logVehicleEntry(data);
    return response;
  }
);

export const logExit = createAsyncThunk(
  'vehicles/logExit',
  async ({ id, payment_mode }: { id: string; payment_mode: string }) => {
    const response = await api.logVehicleExit(id, payment_mode);
    return response;
  }
);

export const fetchVehicleLogs = createAsyncThunk(
  'vehicles/fetchLogs',
  async (filters?: { status?: string; vehicle_number?: string }) => {
    const response = await api.getVehicleLogs(filters);
    return response;
  }
);

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setCurrentEntry: (state, action) => {
      state.currentEntry = action.payload;
    },
    clearCurrentEntry: (state) => {
      state.currentEntry = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveVehicles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchActiveVehicles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeVehicles = action.payload.vehicles;
        state.activeCount = action.payload.count;
      })
      .addCase(logEntry.fulfilled, (state, action) => {
        state.currentEntry = action.payload;
        state.activeVehicles.unshift(action.payload);
        state.activeCount += 1;
      })
      .addCase(logExit.fulfilled, (state, action) => {
        state.activeVehicles = state.activeVehicles.filter(v => v.id !== action.payload.id);
        state.activeCount -= 1;
        state.currentEntry = null;
      })
      .addCase(fetchVehicleLogs.fulfilled, (state, action) => {
        state.vehicleLogs = action.payload;
      });
  },
});

export const { setCurrentEntry, clearCurrentEntry } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;