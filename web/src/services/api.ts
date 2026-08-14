import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  localStorage.setItem('authToken', token);
};

export const clearAuthToken = () => {
  authToken = null;
  delete api.defaults.headers.common['Authorization'];
  localStorage.removeItem('authToken');
};

export const loadAuthToken = () => {
  const token = localStorage.getItem('authToken');
  if (token) setAuthToken(token);
  return token;
};

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then(res => res.data);

export const register = (email: string, password: string, name: string) =>
  api.post('/auth/register', { email, password, name }).then(res => res.data);

// Dashboard
export const getOverview = () => api.get('/dashboard/overview').then(res => res.data);
export const getRecentActivity = () => api.get('/dashboard/recent-activity').then(res => res.data);
export const getTrend = (days: number) => api.get('/dashboard/trend', { params: { days } }).then(res => res.data);
export const getPaymentSettings = () => api.get('/settings/payment').then(res => res.data);
export const updatePaymentSettings = (data: any) => api.patch('/settings/payment', data).then(res => res.data);

// Slots
export const getSlots = (params?: any) => api.get('/slots', { params }).then(res => res.data);
export const updateSlotStatus = (id: string, status: string) =>
  api.patch(`/slots/${id}/status`, { status }).then(res => res.data);

// Vehicles
export const getActiveVehicles = () => api.get('/vehicles/active').then(res => res.data);
export const getVehicleLogs = (params?: any) => api.get('/vehicles', { params }).then(res => res.data);
export const logVehicleEntry = (data: any) => api.post('/vehicles/entry', data).then(res => res.data);
export const logVehicleExit = (id: string, payment_mode: string) =>
  api.post(`/vehicles/exit/${id}`, { payment_mode }).then(res => res.data);

// Expenses
export const getExpenses = (params?: any) => api.get('/expenses', { params }).then(res => res.data);
export const getPendingExpenses = () => api.get('/expenses/pending').then(res => res.data);
export const createExpense = (data: any) => api.post('/expenses', data).then(res => res.data);
export const approveExpense = (id: string) => api.patch(`/expenses/${id}/approve`).then(res => res.data);
export const flagExpense = (id: string, reason: string) =>
  api.patch(`/expenses/${id}/flag`, { reason }).then(res => res.data);

// Staff
export const getStaff = (params?: any) => api.get('/staff', { params }).then(res => res.data);
export const getTodayAttendance = (shift?: string) =>
  api.get('/staff/attendance/today', { params: { shift } }).then(res => res.data);
export const markAttendance = (staffId: string, data: any) =>
  api.patch(`/staff/${staffId}/attendance`, data).then(res => res.data);

// Customers
export const getPasses = (status?: string) => api.get('/customers', { params: { status } }).then(res => res.data);
export const getExpiringPasses = () => api.get('/customers/expiring').then(res => res.data);
export const createPass = (data: any) => api.post('/customers', data).then(res => res.data);
export const renewPass = (id: string, new_end_date: string, amount: number) =>
  api.patch(`/customers/${id}/renew`, { new_end_date, amount }).then(res => res.data);
export const suspendPass = (id: string) => api.patch(`/customers/${id}/suspend`).then(res => res.data);
export const getCustomers = () => api.get('/customers/people').then(res => res.data);
export const createCustomer = (data: any) => api.post('/customers/people', data).then(res => res.data);

// Payroll
export const getPayrollBatch = (month?: number, year?: number) =>
  api.get('/payroll/batch', { params: { month, year } }).then(res => res.data);
export const calculatePayroll = (staffId: string, month?: number, year?: number) =>
  api.get(`/payroll/calculate/${staffId}`, { params: { month, year } }).then(res => res.data);
export const markPayrollPaid = (id: string, payment_mode: string) =>
  api.post(`/payroll/pay/${id}`, { payment_mode }).then(res => res.data);

// Reports
export const getDailyReport = (date?: string) =>
  api.get('/reports/daily', { params: { date } }).then(res => res.data);
export const getMonthlyReport = (month?: number, year?: number) =>
  api.get('/reports/monthly', { params: { month, year } }).then(res => res.data);
export const getDateRangeReport = (params: any) =>
  api.get('/reports/date-range', { params }).then(res => res.data);

// Assets
export const getAssets = () => api.get('/assets').then(res => res.data);
export const getAssetsDueForService = () => api.get('/assets/due-for-service').then(res => res.data);
export const createAsset = (data: any) => api.post('/assets', data).then(res => res.data);
export const logMaintenance = (assetId: string, data: any) =>
  api.post(`/assets/${assetId}/maintenance`, data).then(res => res.data);

// Vendors
export const getVendors = (category?: string) =>
  api.get('/vendors', { params: { category } }).then(res => res.data);
export const createVendor = (data: any) => api.post('/vendors', data).then(res => res.data);

export default api;