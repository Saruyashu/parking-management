import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

interface CustomersState {
  passes: any[];
  expiringPasses: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  passes: [],
  expiringPasses: [],
  isLoading: false,
  error: null,
};

export const fetchPasses = createAsyncThunk('customers/fetchPasses', async (status?: string) => {
  const response = await api.getPasses(status);
  return response;
});

export const fetchExpiringPasses = createAsyncThunk('customers/fetchExpiring', async () => {
  const response = await api.getExpiringPasses();
  return response;
});

export const createPass = createAsyncThunk('customers/createPass', async (data: any) => {
  const response = await api.createPass(data);
  return response;
});

export const renewPass = createAsyncThunk(
  'customers/renewPass',
  async ({ id, new_end_date, amount }: { id: string; new_end_date: string; amount: number }) => {
    const response = await api.renewPass(id, new_end_date, amount);
    return response;
  }
);

export const suspendPass = createAsyncThunk('customers/suspendPass', async (id: string) => {
  const response = await api.suspendPass(id);
  return response;
});

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPasses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPasses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.passes = action.payload;
      })
      .addCase(fetchExpiringPasses.fulfilled, (state, action) => {
        state.expiringPasses = action.payload;
      })
      .addCase(createPass.fulfilled, (state, action) => {
        state.passes.unshift(action.payload);
      })
      .addCase(renewPass.fulfilled, (state, action) => {
        state.passes = state.passes.map(p => p.id === action.payload.id ? action.payload : p);
      })
      .addCase(suspendPass.fulfilled, (state, action) => {
        state.passes = state.passes.map(p => p.id === action.payload.id ? action.payload : p);
      });
  },
});

export default customersSlice.reducer;