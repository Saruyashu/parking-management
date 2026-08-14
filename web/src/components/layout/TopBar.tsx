import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { RootState, AppDispatch } from '../../store';
import { fetchExpiringPasses } from '../../store/slices/customersSlice';
import { fetchPendingExpenses } from '../../store/slices/expensesSlice';

const titles: Record<string, string> = {
  '/': 'Overview',
  '/expenses': 'Expenses',
  '/revenue': 'Revenue',
  '/staff': 'Staff',
  '/customers': 'Customers',
  '/vehicles': 'Vehicles',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export const TopBar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { pendingExpenses } = useSelector((state: RootState) => state.expenses);
  const { expiringPasses } = useSelector((state: RootState) => state.customers);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    dispatch(fetchExpiringPasses());
    dispatch(fetchPendingExpenses());
  }, [dispatch]);

  const notificationCount = pendingExpenses.length + expiringPasses.length;
  const pageTitle = titles[location.pathname] || 'Overview';

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="h-16 border-b border-ink-border flex items-center justify-between px-6 bg-ink-surface">
      <div>
        <h2 className="font-display text-2xl text-text-primary">{pageTitle}</h2>
        <p className="text-xs text-text-tertiary">{today}</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-md hover:bg-ink-elevated transition-colors duration-150"
        >
          <Bell size={18} className="text-text-secondary" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brass text-ink text-[10px] font-medium rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 bg-ink-elevated border border-ink-active rounded-lg shadow-2xl z-50">
            <div className="p-4 border-b border-ink-active">
              <h3 className="text-sm font-medium text-text-primary">Notifications</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {pendingExpenses.length > 0 && (
                <div className="p-4 border-b border-ink-active flex gap-3">
                  <span className="w-1 rounded bg-warning" />
                  <div>
                    <p className="text-sm text-text-primary">{pendingExpenses.length} expenses pending approval</p>
                    <p className="text-xs text-text-tertiary mt-1">Logged by staff, waiting for your review</p>
                  </div>
                </div>
              )}
              {expiringPasses.length > 0 && (
                <div className="p-4 border-b border-ink-active flex gap-3">
                  <span className="w-1 rounded bg-danger" />
                  <div>
                    <p className="text-sm text-text-primary">{expiringPasses.length} passes expiring</p>
                    <p className="text-xs text-text-tertiary mt-1">Renewals due within 7 days</p>
                  </div>
                </div>
              )}
              {notificationCount === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-text-tertiary">No new notifications</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};