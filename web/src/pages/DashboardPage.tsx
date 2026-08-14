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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { RootState, AppDispatch } from '../store';
import { fetchOverview, fetchRecentActivity, fetchTrend } from '../store/slices/dashboardSlice';
import { fetchExpenses } from '../store/slices/expensesSlice';
import { MetricCard, formatIndianNumber } from '../components/MetricCard';

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

export const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { overview, recentActivity, trend } = useSelector((state: RootState) => state.dashboard);
  const { summary } = useSelector((state: RootState) => state.expenses);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

  const rangeDays = { '7d': 7, '30d': 30, '90d': 90 };

  useEffect(() => {
    dispatch(fetchOverview());
    dispatch(fetchRecentActivity());
    dispatch(fetchExpenses());
    dispatch(fetchTrend(rangeDays[range]));
  }, [dispatch, range]);

  const revenue = overview?.month.revenue || 0;
  const expenses = overview?.month.expenses || 0;
  const profit = revenue - expenses;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';

  const chartData = trend.data.length > 0
    ? trend.data
    : [{ name: 'Aug', revenue: 245000, expenses: 118000 }, { name: 'Sep', revenue: 268000, expenses: 125000 }];

  const pieData = Object.entries(summary.byCategory).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
    color: categoryColors[name] || '#636E72',
  }));

  const formatRupee = (value: number) => `₹${formatIndianNumber(value)}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Today's Revenue"
          value={overview?.today.revenue || 0}
          change={overview?.today.revenueChange}
        />
        <MetricCard
          label="Monthly Profit"
          value={profit}
          change={12}
        />
        <MetricCard
          label="Occupancy"
          value={overview?.occupancy.percent || 0}
          prefix=""
          change={-3}
        />
        <MetricCard
          label="Pending Approvals"
          value={overview?.today.pendingExpenses || 0}
          prefix=""
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title">Revenue vs Expenses</h3>
            <div className="flex gap-1">
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors duration-150 ${
                    range === r
                      ? 'bg-brass text-ink'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={6}>
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
                  formatter={(value: number) => formatRupee(value)}
                  cursor={{ fill: 'rgba(200,169,126,0.05)' }}
                />
                <Bar dataKey="revenue" fill="#4CAF7D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#C8A97E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title mb-6">Expense Breakdown</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1E1E',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name) => [`${formatRupee(value)}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-text-secondary">{item.name}</span>
                </div>
                <span className="text-xs font-mono text-text-primary">
                  {formatRupee(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title">Recent Activity</h3>
            <button className="text-xs text-text-tertiary hover:text-brass transition-colors duration-150">
              View all →
            </button>
          </div>
          <div className="space-y-1">
            {recentActivity.slice(0, 6).map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-ink-border last:border-0"
              >
                <div>
                  <p className="text-sm text-text-primary">{activity.title}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {activity.subtitle} ·{' '}
                    {new Date(activity.time).toLocaleTimeString('en-IN', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    }).toLowerCase()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-mono ${
                      activity.type === 'expense' ? 'text-text-primary' : 'text-success'
                    }`}
                  >
                    {activity.type === 'expense' ? '' : '+'}₹
                    {formatIndianNumber(activity.amount)}
                  </span>
                  {activity.type === 'expense' && (
                    <span
                      className={`badge ${
                        activity.status === 'PENDING' ? 'badge-pending' : 'badge-approved'
                      }`}
                    >
                      {activity.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="section-title mb-6">Quick Stats</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-text-secondary">Slot Utilization</span>
                <span className="text-xs font-mono text-text-primary">
                  {overview?.occupancy.current || 0}/{overview?.occupancy.total || 0}
                </span>
              </div>
              <div className="h-1.5 bg-ink-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{ width: `${overview?.occupancy.percent || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-text-secondary">Monthly Budget Used</span>
                <span className="text-xs font-mono text-text-primary">
                  {((expenses / 148200) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-ink-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-brass rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((expenses / 148200) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-text-secondary">Profit Margin</span>
                <span className="text-xs font-mono text-text-primary">{margin}%</span>
              </div>
              <div className="h-1.5 bg-ink-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{ width: `${margin}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};