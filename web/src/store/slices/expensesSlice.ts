import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

interface ExpensesState {
  expenses: any[];
  pendingExpenses: any[];
  summary: { total: number; byCategory: Record<string, number>; count: number };
  isLoading: boolean;
  error: string | null;
}

const initialState: ExpensesState = {
  expenses: [],
  pendingExpenses: [],
  summary: { total: 0, byCategory: {}, count: 0 },
  isLoading: false,
  error: null,
};

export const fetchExpenses = createAsyncThunk<any, void>('expenses/fetch', async (params: any = undefined) => {
  const response = await api.getExpenses(params);
  return response;
});

export const fetchPendingExpenses = createAsyncThunk('expenses/fetchPending', async () => {
  const response = await api.getPendingExpenses();
  return response;
});

export const approveExpense = createAsyncThunk('expenses/approve', async (id: string) => {
  const response = await api.approveExpense(id);
  return response;
});

export const flagExpense = createAsyncThunk(
  'expenses/flag',
  async ({ id, reason }: { id: string; reason: string }) => {
    const response = await api.flagExpense(id, reason);
    return response;
  }
);

export const createExpense = createAsyncThunk('expenses/create', async (data: any) => {
  const response = await api.createExpense(data);
  return response;
});

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = action.payload.expenses;
        state.summary = action.payload.summary;
      })
      .addCase(fetchPendingExpenses.fulfilled, (state, action) => {
        state.pendingExpenses = action.payload;
      })
      .addCase(approveExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.map(e => e.id === action.payload.id ? action.payload : e);
        state.pendingExpenses = state.pendingExpenses.filter(e => e.id !== action.payload.id);
      })
      .addCase(flagExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.map(e => e.id === action.payload.id ? action.payload : e);
        state.pendingExpenses = state.pendingExpenses.filter(e => e.id !== action.payload.id);
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
      });
  },
});

export default expensesSlice.reducer;