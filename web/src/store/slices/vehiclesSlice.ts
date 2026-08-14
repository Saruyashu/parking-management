import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

interface VehiclesState {
  activeVehicles: { vehicles: any[] } | null;
  logs: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: VehiclesState = {
  activeVehicles: null,
  logs: [],
  isLoading: false,
  error: null,
};

export const fetchActiveVehicles = createAsyncThunk('vehicles/fetchActive', async () => {
  return await api.getActiveVehicles();
});

export const fetchVehicleLogs = createAsyncThunk<any, void>('vehicles/fetchLogs', async (params: any = undefined) => {
  return await api.getVehicleLogs(params);
});

export const createVehicleEntry = createAsyncThunk('vehicles/createEntry', async (data: any) => {
  return await api.logVehicleEntry(data);
});

export const processVehicleExit = createAsyncThunk('vehicles/processExit', async ({ id, payment_mode }: { id: string; payment_mode: string }) => {
  return await api.logVehicleExit(id, payment_mode);
});

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveVehicles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchActiveVehicles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeVehicles = action.payload;
      })
      .addCase(fetchActiveVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch vehicles';
      })
      .addCase(fetchVehicleLogs.fulfilled, (state, action) => {
        state.logs = action.payload;
      })
      .addCase(createVehicleEntry.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(processVehicleExit.fulfilled, (state) => {
        state.isLoading = false;
      });
  },
});

export default vehiclesSlice.reducer;
