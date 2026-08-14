import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

interface Slot {
  id: string;
  slot_number: string;
  category: string;
  status: string;
  has_charger: boolean;
  is_reserved: boolean;
  zone: { name: string };
  monthly_pass?: { customer: { name: string } };
}

interface SlotsState {
  slots: Slot[];
  summary: { total: number; occupied: number; available: number; reserved: number };
  isLoading: boolean;
  error: string | null;
}

const initialState: SlotsState = {
  slots: [],
  summary: { total: 0, occupied: 0, available: 0, reserved: 0 },
  isLoading: false,
  error: null,
};

export const fetchSlots = createAsyncThunk(
  'slots/fetchSlots',
  async (filters?: { zone_id?: string; category?: string; status?: string }) => {
    const response = await api.getSlots(filters);
    return response;
  }
);

export const updateSlotStatus = createAsyncThunk(
  'slots/updateStatus',
  async ({ id, status }: { id: string; status: string }) => {
    const response = await api.updateSlotStatus(id, status);
    return response;
  }
);

const slotsSlice = createSlice({
  name: 'slots',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSlots.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSlots.fulfilled, (state, action) => {
        state.isLoading = false;
        state.slots = action.payload.slots;
        state.summary = action.payload.summary;
      })
      .addCase(fetchSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch slots';
      });
  },
});

export default slotsSlice.reducer;