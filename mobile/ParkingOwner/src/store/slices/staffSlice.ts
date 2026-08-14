import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

interface Staff {
  id: string;
  name: string;
  phone: string;
  role: string;
  shift: string;
  employment_type: string;
  wage_rate: number;
  is_monthly: boolean;
  status: string;
}

interface Attendance {
  id: string;
  staff_id: string;
  date: string;
  shift: string;
  status: string;
  late_by_minutes?: number;
  staff?: Staff;
}

interface StaffState {
  staff: Staff[];
  todayAttendance: (Staff & { todayAttendance: Attendance | null })[];
  isLoading: boolean;
  error: string | null;
}

const initialState: StaffState = {
  staff: [],
  todayAttendance: [],
  isLoading: false,
  error: null,
};

export const fetchStaff = createAsyncThunk('staff/fetchStaff', async (filters?: { shift?: string }) => {
  const response = await api.getStaff(filters);
  return response;
});

export const fetchTodayAttendance = createAsyncThunk('staff/fetchTodayAttendance', async (shift?: string) => {
  const response = await api.getTodayAttendance(shift);
  return response;
});

export const markAttendance = createAsyncThunk(
  'staff/markAttendance',
  async ({ staffId, data }: { staffId: string; data: { date: string; shift: string; status: string; late_by_minutes?: number } }) => {
    const response = await api.markAttendance(staffId, data);
    return response;
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staff = action.payload;
      })
      .addCase(fetchTodayAttendance.fulfilled, (state, action) => {
        state.todayAttendance = action.payload;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        const idx = state.todayAttendance.findIndex(s => s.id === action.payload.staff_id);
        if (idx !== -1) {
          state.todayAttendance[idx].todayAttendance = action.payload;
        }
      });
  },
});

export default staffSlice.reducer;