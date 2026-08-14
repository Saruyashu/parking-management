import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

interface Expense {
  id: string;
  date: string;
  category: string;
  sub_category?: string;
  amount: number;
  payment_mode: string;
  reference_number?: string;
  description?: string;
  attachments: string[];
  is_recurring: boolean;
  status: string;
  vendor?: { business_name: string };
  created_by_user: { name: string };
}

interface ExpensesState {
  expenses: Expense[];
  pendingExpenses: Expense[];
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

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (filters?: { category?: string; status?: string; start_date?: string; end_date?: string }) => {
    const response = await api.getExpenses(filters);
    return response;
  }
);

export const fetchPendingExpenses = createAsyncThunk('expenses/fetchPending', async () => {
  const response = await api.getPendingExpenses();
  return response;
});

export const createExpense = createAsyncThunk(
  'expenses/create',
  async (data: {
    date: string;
    category: string;
    sub_category?: string;
    vendor_id?: string;
    amount: number;
    payment_mode: string;
    reference_number?: string;
    description?: string;
    attachments?: string[];
    is_recurring?: boolean;
    recurrence_frequency?: string;
    recurrence_end_date?: string;
  }) => {
    const response = await api.createExpense(data);
    return response;
  }
);

export const approveExpense = createAsyncThunk(
  'expenses/approve',
  async (id: string) => {
    const response = await api.approveExpense(id);
    return response;
  }
);

export const flagExpense = createAsyncThunk(
  'expenses/flag',
  async ({ id, reason }: { id: string; reason: string }) => {
    const response = await api.flagExpense(id, reason);
    return response;
  }
);

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
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
        state.pendingExpenses.unshift(action.payload);
      })
      .addCase(approveExpense.fulfilled, (state, action) => {
        const idx = state.expenses.findIndex(e => e.id === action.payload.id);
        if (idx !== -1) state.expenses[idx] = action.payload;
        state.pendingExpenses = state.pendingExpenses.filter(e => e.id !== action.payload.id);
      })
      .addCase(flagExpense.fulfilled, (state, action) => {
        const idx = state.expenses.findIndex(e => e.id === action.payload.id);
        if (idx !== -1) state.expenses[idx] = action.payload;
        state.pendingExpenses = state.pendingExpenses.filter(e => e.id !== action.payload.id);
      });
  },
});

export default expensesSlice.reducer;