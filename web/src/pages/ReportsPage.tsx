import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { RootState, AppDispatch } from '../store';
import { fetchMonthlyReport } from '../store/slices/reportsSlice';
import { fetchOverview } from '../store/slices/dashboardSlice';
import { fetchExpenses } from '../store/slices/expensesSlice';
import { formatIndianNumber } from '../components/MetricCard';
import * as XLSX from 'xlsx';

const categoryColors: Record<string, string> = {
  STAFF_WAGES: '#7B68EE',
  UTILITIES: '#4ECDC4',
  MAINTENANCE: '#F7B731',
  SECURITY: '#5A8FBF',
  RENT_LEASE: '#A29BFE',
  EQUIPMENT: '#E17055',
  VENDOR: '#FD79A8',
  TAX_LICENSE: '#00B894',
  SOFTWARE: '#636E72',
  INSURANCE: '#FDCB6E',
  MISCELLANEOUS: '#B2BEC3',
};

const categoryLabels: Record<string, string> = {
  STAFF_WAGES: 'Staff Wages',
  UTILITIES: 'Utilities',
  MAINTENANCE: 'Maintenance',
  SECURITY: 'Security',
  RENT_LEASE: 'Rent & Lease',
  EQUIPMENT: 'Equipment',
  VENDOR: 'Vendor',
  TAX_LICENSE: 'Tax & License',
  SOFTWARE: 'Software',
  INSURANCE: 'Insurance',
  MISCELLANEOUS: 'Miscellaneous',
};

export const ReportsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { report } = useSelector((state: RootState) => state.reports);
  const { overview } = useSelector((state: RootState) => state.dashboard);
  const { summary } = useSelector((state: RootState) => state.expenses);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    dispatch(fetchMonthlyReport({ month, year }));
    dispatch(fetchOverview());
    dispatch(fetchExpenses());
  }, [dispatch, month, year]);

  const revenue = report?.revenue?.total || overview?.month.revenue || 0;
  const expenses = report?.expenses?.total || overview?.month.expenses || 0;
  const profit = revenue - expenses;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';

  const expensesByCategory = report?.expenses?.byCategory || summary.byCategory || {};

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name: categoryLabels[name] || name.replace(/_/g, ' '),
    value,
    color: categoryColors[name] || '#636E72',
  }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      Object.entries(expensesByCategory).map(([category, amount]) => ({
        Category: categoryLabels[category] || category,
        Amount: amount,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, `parking-report-${month}-${year}.xlsx`);
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="input text-sm py-1.5"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {new Date(2024, m - 1, 1).toLocaleDateString('en-IN', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="input text-sm py-1.5"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button onClick={exportExcel} className="btn-secondary text-sm">
          Export Excel
        </button>
      </div>

      <div className="card">
        <h3 className="section-title mb-6">P&L Summary</h3>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <p className="kpi-label">Revenue</p>
            <p className="font-display text-3xl text-success mt-2">
              ₹{formatIndianNumber(revenue)}
            </p>
          </div>
          <div>
            <p className="kpi-label">Expenses</p>
            <p className="font-display text-3xl text-warning mt-2">
              ₹{formatIndianNumber(expenses)}
            </p>
          </div>
          <div>
            <p className="kpi-label">Net Profit</p>
            <p className={`font-display text-3xl mt-2 ${profit >= 0 ? 'text-text-primary' : 'text-danger'}`}>
              {profit >= 0 ? '' : '−'}₹{formatIndianNumber(Math.abs(profit))}
            </p>
            <p className="text-xs text-text-tertiary mt-1">{margin}% margin</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="section-title mb-6">Revenue vs Expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Revenue', value: revenue, fill: '#4CAF7D' },
                { name: 'Expenses', value: expenses, fill: '#C8A97E' },
              ]}>
                <CartesianGrid stroke="#1E1E1E" vertical={false} />
                <XAxis dataKey="name" stroke="#5A5754" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5A5754" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1E1E', border: 'none', borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => `₹${formatIndianNumber(value)}`}
                  cursor={{ fill: 'rgba(200,169,126,0.05)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {[
                    <Cell key="r" fill="#4CAF7D" />,
                    <Cell key="e" fill="#C8A97E" />,
                  ]}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title mb-6">Expense Breakdown</h3>
          <div className="flex items-center gap-8">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E1E1E', border: 'none', borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, name) => [`₹${formatIndianNumber(value)}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.sort((a: any, b: any) => b.value - a.value).slice(0, 5).map((item: any) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-text-secondary">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono text-text-primary">
                    {((item.value / (expenses || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between p-6 pb-3">
          <h3 className="section-title">Expense Ledger</h3>
          <span className="text-xs text-text-tertiary">
            {Object.keys(expensesByCategory).length} categories
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-border">
              <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Category</th>
              <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Amount</th>
              <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(expensesByCategory)
              .sort((a: any, b: any) => b[1] - a[1])
              .map(([category, amount]: [string, any]) => (
                <tr key={category} className="table-row-hover border-b border-ink-border last:border-0">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[category] || '#636E72' }} />
                      <span className="text-sm text-text-primary">{categoryLabels[category] || category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-mono text-text-primary">
                    ₹{formatIndianNumber(amount)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-mono text-text-secondary">
                    {((amount / (expenses || 1)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};