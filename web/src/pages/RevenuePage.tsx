import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts';
import { RootState, AppDispatch } from '../store';
import { fetchOverview, fetchTrend } from '../store/slices/dashboardSlice';
import { MetricCard, formatIndianNumber } from '../components/MetricCard';

export const RevenuePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { overview, trend } = useSelector((state: RootState) => state.dashboard);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

  const rangeDays = { '7d': 7, '30d': 30, '90d': 90 };

  useEffect(() => {
    dispatch(fetchOverview());
    dispatch(fetchTrend(rangeDays[range]));
  }, [dispatch, range]);

  const revenue = overview?.month.revenue || 0;
  const trendData = trend.data || [];

  const totalTrendRevenue = trendData.reduce((s: number, d: any) => s + d.revenue, 0);
  const totalTrendExpenses = trendData.reduce((s: number, d: any) => s + d.expenses, 0);
  const net = totalTrendRevenue - totalTrendExpenses;
  const avgDaily = trendData.length ? totalTrendRevenue / trendData.length : 0;

  const cashRate = 0.32;
  const digitalRate = 0.6;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Period Revenue" value={totalTrendRevenue} changeLabel="in period" />
        <MetricCard label="Cash" value={totalTrendRevenue * cashRate} changeLabel="of total" />
        <MetricCard label="Digital (UPI/Card)" value={totalTrendRevenue * digitalRate} changeLabel="of total" />
        <MetricCard label="Avg Daily" value={avgDaily} changeLabel="in period" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="section-title">Revenue Trend</h3>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs rounded-md transition-colors duration-150 ${
                  range === r ? 'bg-brass text-ink' : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8A97E" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#C8A97E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E1E1E" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#5A5754"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#5A5754"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E1E1E',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`₹${formatIndianNumber(value)}`, 'Revenue']}
                cursor={{ stroke: '#3D3D3D' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#C8A97E"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="section-title mb-6">Revenue vs Expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barGap={4}>
                <CartesianGrid stroke="#1E1E1E" vertical={false} />
                <XAxis dataKey="label" stroke="#5A5754" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5A5754" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1E1E', border: 'none', borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, name) => [`₹${formatIndianNumber(value)}`, name === 'revenue' ? 'Revenue' : 'Expenses']}
                  cursor={{ fill: 'rgba(200,169,126,0.05)' }}
                />
                <Bar dataKey="revenue" fill="#4CAF7D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#C8A97E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title mb-6">Period Summary</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-text-secondary">Revenue</span>
                <span className="text-sm font-mono text-text-primary">₹{formatIndianNumber(totalTrendRevenue)}</span>
              </div>
              <div className="h-1.5 bg-ink-elevated rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-text-secondary">Expenses</span>
                <span className="text-sm font-mono text-text-primary">₹{formatIndianNumber(totalTrendExpenses)}</span>
              </div>
              <div className="h-1.5 bg-ink-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-brass rounded-full"
                  style={{ width: `${Math.min((totalTrendExpenses / (totalTrendRevenue || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-text-secondary">Net</span>
                <span className={`text-sm font-mono ${net >= 0 ? 'text-text-primary' : 'text-danger'}`}>
                  {net >= 0 ? '' : '−'}₹{formatIndianNumber(Math.abs(net))}
                </span>
              </div>
              <div className="h-1.5 bg-ink-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full"
                  style={{ width: `${Math.max(Math.min((net / (totalTrendRevenue || 1)) * 100, 100), 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};