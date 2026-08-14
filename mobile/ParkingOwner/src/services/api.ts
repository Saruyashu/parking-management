import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  SecureStore.setItemAsync('authToken', token);
};

export const clearAuthToken = () => {
  authToken = null;
  delete api.defaults.headers.common['Authorization'];
  SecureStore.deleteItemAsync('authToken');
};

export const loadAuthToken = async () => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    setAuthToken(token);
  }
  return token;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && error.config && !error.config._retry) {
      error.config._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          setAuthToken(response.data.token);
          error.config.headers['Authorization'] = `Bearer ${response.data.token}`;
          return api(error.config);
        }
      } catch (refreshError) {
        clearAuthToken();
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then(res => res.data);

export const register = (email: string, password: string, name: string) =>
  api.post('/auth/register', { email, password, name }).then(res => res.data);

export const getMe = () => api.get('/auth/me').then(res => res.data);

// Slots
export const getSlots = (filters?: { zone_id?: string; category?: string; status?: string }) =>
  api.get('/slots', { params: filters }).then(res => res.data);

export const updateSlotStatus = (id: string, status: string) =>
  api.patch(`/slots/${id}/status`, { status }).then(res => res.data);

// Vehicles
export const getActiveVehicles = () => api.get('/vehicles/active').then(res => res.data);

export const logVehicleEntry = (data: { slot_id: string; vehicle_number: string; category: string }) =>
  api.post('/vehicles/entry', data).then(res => res.data);

export const logVehicleExit = (id: string, payment_mode: string) =>
  api.post(`/vehicles/exit/${id}`, { payment_mode }).then(res => res.data);

export const getVehicleLogs = (filters?: { status?: string; vehicle_number?: string; start_date?: string; end_date?: string }) =>
  api.get('/vehicles', { params: filters }).then(res => res.data);

export const blacklistVehicle = (vehicle_number: string, reason: string) =>
  api.post('/vehicles/blacklist', { vehicle_number, reason }).then(res => res.data);

// Expenses
export const getExpenses = (filters?: { category?: string; status?: string; start_date?: string; end_date?: string }) =>
  api.get('/expenses', { params: filters }).then(res => res.data);

export const getPendingExpenses = () => api.get('/expenses/pending').then(res => res.data);

export const createExpense = (data: {
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
}) => api.post('/expenses', data).then(res => res.data);

export const approveExpense = (id: string) =>
  api.patch(`/expenses/${id}/approve`).then(res => res.data);

export const flagExpense = (id: string, reason: string) =>
  api.patch(`/expenses/${id}/flag`, { reason }).then(res => res.data);

// Staff
export const getStaff = (filters?: { shift?: string; status?: string }) =>
  api.get('/staff', { params: filters }).then(res => res.data);

export const getTodayAttendance = (shift?: string) =>
  api.get('/staff/attendance/today', { params: { shift } }).then(res => res.data);

export const markAttendance = (staffId: string, data: { date: string; shift: string; status: string; late_by_minutes?: number }) =>
  api.patch(`/staff/${staffId}/attendance`, data).then(res => res.data);

// Dashboard
export const getDashboardOverview = () => api.get('/dashboard/overview').then(res => res.data);

export const getRecentActivity = () => api.get('/dashboard/recent-activity').then(res => res.data);

// Reports
export const getDailyReport = (date?: string) =>
  api.get('/reports/daily', { params: { date } }).then(res => res.data);

export const getMonthlyReport = (month?: number, year?: number) =>
  api.get('/reports/monthly', { params: { month, year } }).then(res => res.data);

// Customers
export const getPasses = (status?: string) =>
  api.get('/customers', { params: { status } }).then(res => res.data);

export const createPass = (data: {
  customer_id: string;
  slot_id: string;
  pass_type: string;
  vehicle_number: string;
  start_date: string;
  end_date: string;
  amount: number;
  auto_renew?: boolean;
}) => api.post('/customers', data).then(res => res.data);

export const renewPass = (id: string, new_end_date: string, amount: number) =>
  api.patch(`/customers/${id}/renew`, { new_end_date, amount }).then(res => res.data);

// Payroll
export const calculatePayroll = (staffId: string, month?: number, year?: number) =>
  api.get(`/payroll/calculate/${staffId}`, { params: { month, year } }).then(res => res.data);

export const getPayrollBatch = (month?: number, year?: number) =>
  api.get('/payroll/batch', { params: { month, year } }).then(res => res.data);

export const markPayrollPaid = (id: string, payment_mode: string) =>
  api.post(`/payroll/pay/${id}`, { payment_mode }).then(res => res.data);

// Assets
export const getAssets = () => api.get('/assets').then(res => res.data);

export const getAssetsDueForService = () => api.get('/assets/due-for-service').then(res => res.data);

export const logMaintenance = (assetId: string, data: {
  date: string;
  description: string;
  cost: number;
  vendor_id?: string;
  receipt_url?: string;
}) => api.post(`/assets/${assetId}/maintenance`, data).then(res => res.data);

// Vendors
export const getVendors = (category?: string) =>
  api.get('/vendors', { params: { category } }).then(res => res.data);

// Settings / payment
export const getPaymentSettings = () => api.get('/settings/payment').then(res => res.data);

export default api;