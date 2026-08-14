import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

interface StaffState {
  staff: any[];
  todayAttendance: any[];
  payroll: any;
  isLoading: boolean;
  error: string | null;
}

const initialState: StaffState = {
  staff: [],
  todayAttendance: [],
  payroll: null,
  isLoading: false,
  error: null,
};

export const fetchStaff = createAsyncThunk<any, void>('staff/fetch', async (params: any = undefined) => {
  const response = await api.getStaff(params);
  return response;
});

export const fetchTodayAttendance = createAsyncThunk('staff/fetchAttendance', async (shift?: string) => {
  const response = await api.getTodayAttendance(shift);
  return response;
});

export const markAttendance = createAsyncThunk(
  'staff/markAttendance',
  async ({ staffId, data }: { staffId: string; data: any }) => {
    const response = await api.markAttendance(staffId, data);
    return response;
  }
);

export const fetchPayroll = createAsyncThunk(
  'staff/fetchPayroll',
  async ({ month, year }: { month?: number; year?: number }) => {
    const response = await api.getPayrollBatch(month, year);
    return response;
  }
);

export const paySalary = createAsyncThunk(
  'staff/paySalary',
  async ({ id, payment_mode }: { id: string; payment_mode: string }) => {
    const response = await api.markPayrollPaid(id, payment_mode);
    return response;
  }
);

export const calculatePayroll = createAsyncThunk<any, any>('staff/calculatePayroll', async ({ staffId, month, year }: { staffId: string; month?: number; year?: number }) => {
  const response = await api.calculatePayroll(staffId, month, year);
  return response;
});

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
        state.todayAttendance = state.todayAttendance.map((s: any) =>
          s.id === action.payload.staff_id ? { ...s, todayAttendance: action.payload } : s
        );
      })
      .addCase(fetchPayroll.fulfilled, (state, action) => {
        state.payroll = action.payload;
      })
      .addCase(paySalary.fulfilled, (state, action) => {
        if (state.payroll) {
          state.payroll.payrolls = state.payroll.payrolls.map((p: any) =>
            p.staff.id === action.payload.staff_id ? { ...p, payroll: action.payload } : p
          );
        }
      })
      .addCase(calculatePayroll.fulfilled, (state, action) => {
        if (state.payroll) {
          const updated = action.payload;
          state.payroll.payrolls = state.payroll.payrolls.map((p: any) =>
            p.staff.id === updated.staff_id ? { ...p, payroll: updated } : p
          );
        }
      });
  },
});

export default staffSlice.reducer;