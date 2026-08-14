import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  fetchStaff,
  fetchTodayAttendance,
  markAttendance,
  fetchPayroll,
  paySalary,
  calculatePayroll,
} from '../store/slices/staffSlice';
import { formatIndianNumber } from '../components/MetricCard';

const statusColors: Record<string, { text: string; bg: string }> = {
  PRESENT: { text: 'text-success', bg: 'bg-success/12' },
  ABSENT: { text: 'text-danger', bg: 'bg-danger/12' },
  HALF_DAY: { text: 'text-warning', bg: 'bg-warning/12' },
  LEAVE: { text: 'text-text-tertiary', bg: 'bg-text-tertiary/12' },
  NOT_MARKED: { text: 'text-text-tertiary', bg: 'bg-text-tertiary/12' },
};

export const StaffPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { staff, todayAttendance, payroll } = useSelector((state: RootState) => state.staff);
  const [activeTab, setActiveTab] = useState<'attendance' | 'payroll'>('attendance');
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());

  useEffect(() => {
    dispatch(fetchStaff());
    dispatch(fetchTodayAttendance());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'payroll') {
      dispatch(fetchPayroll({ month: payrollMonth, year: payrollYear }));
    }
  }, [activeTab, payrollMonth, payrollYear, dispatch]);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleMark = (staffId: string, status: string) => {
    dispatch(markAttendance({
      staffId,
      data: {
        date: new Date().toISOString(),
        shift: 'MORNING',
        status,
      },
    }));
  };

  const handlePay = (id: string) => {
    dispatch(paySalary({ id, payment_mode: 'BANK_TRANSFER' }));
  };

  const handleCalculate = (staffId: string) => {
    dispatch(calculatePayroll({ staffId, month: payrollMonth, year: payrollYear }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="section-title">{today}</h3>
        <div className="flex gap-1">
          {(['attendance', 'payroll'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs rounded-md capitalize transition-colors duration-150 ${
                activeTab === tab
                  ? 'bg-brass text-ink'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'attendance' ? (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-border">
                <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                  Staff
                </th>
                <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                  Shift
                </th>
                <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                  Wage
                </th>
                <th className="text-center px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {todayAttendance.map((s: any) => {
                const status = s.todayAttendance?.status || 'NOT_MARKED';
                const colors = statusColors[status];
                return (
                  <tr key={s.id} className="table-row-hover border-b border-ink-border last:border-0">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brass/20 flex items-center justify-center">
                          <span className="text-brass text-sm font-medium">
                            {s.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-text-primary font-medium">{s.name}</p>
                          <p className="text-xs text-text-tertiary">{s.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{s.role}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{s.shift}</td>
                    <td className="px-6 py-3.5 text-sm font-mono text-text-primary">
                      ₹{formatIndianNumber(s.wage_rate)}/{s.is_monthly ? 'mo' : 'day'}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleMark(s.id, 'PRESENT')}
                          className="px-3 py-1 text-xs rounded-md bg-success/12 text-success hover:bg-success hover:text-ink transition-colors duration-150"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleMark(s.id, 'ABSENT')}
                          className="px-3 py-1 text-xs rounded-md bg-danger/12 text-danger hover:bg-danger hover:text-ink transition-colors duration-150"
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleMark(s.id, 'HALF_DAY')}
                          className="px-3 py-1 text-xs rounded-md bg-warning/12 text-warning hover:bg-warning hover:text-ink transition-colors duration-150"
                        >
                          Half-day
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(parseInt(e.target.value))}
                className="input text-sm py-1.5"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i, 1).toLocaleDateString('en-IN', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={payrollYear}
                onChange={(e) => setPayrollYear(parseInt(e.target.value))}
                className="input text-sm py-1.5"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {payroll && (
              <div className="text-sm text-text-secondary">
                Total payable:{' '}
                <span className="font-mono text-text-primary">
                  ₹{formatIndianNumber(payroll.totalPayable)}
                </span>
              </div>
            )}
          </div>

          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-border">
                  <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Staff</th>
                  <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Days Present</th>
                  <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Basic Wage</th>
                  <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Net Payable</th>
                  <th className="text-center px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Status</th>
                  <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {payroll?.payrolls?.map((item: any) => (
                  <tr key={item.staff.id} className="table-row-hover border-b border-ink-border last:border-0">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brass/20 flex items-center justify-center">
                          <span className="text-brass text-sm font-medium">
                            {item.staff.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-text-primary font-medium">{item.staff.name}</p>
                          <p className="text-xs text-text-tertiary">{item.staff.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-mono text-text-primary">
                      {item.payroll?.days_present || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-mono text-text-primary">
                      ₹{formatIndianNumber(item.payroll?.basic_wage || 0)}
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-mono text-text-primary">
                      ₹{formatIndianNumber(item.payroll?.net_payable || 0)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {item.payroll?.status === 'PAID' ? (
                        <span className="badge-paid">Paid</span>
                      ) : (
                        <span className="badge-pending">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {item.payroll?.status !== 'PAID' && item.payroll && (
                        <button
                          onClick={() => handlePay(item.payroll.id)}
                          className="px-3 py-1 text-xs rounded-md bg-success text-ink font-medium hover:opacity-90 transition-opacity duration-150"
                        >
                          Mark Paid
                        </button>
                      )}
                      {!item.payroll && (
                        <button
                          onClick={() => handleCalculate(item.staff.id)}
                          className="px-3 py-1 text-xs rounded-md bg-ink-active text-text-secondary hover:text-text-primary transition-colors duration-150"
                        >
                          Calculate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};