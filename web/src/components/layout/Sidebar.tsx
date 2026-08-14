import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Users,
  Car,
  CircleUserRound,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Wallet },
  { path: '/revenue', label: 'Revenue', icon: TrendingUp },
  { path: '/staff', label: 'Staff', icon: Users },
  { path: '/customers', label: 'Customers', icon: CircleUserRound },
  { path: '/vehicles', label: 'Vehicles', icon: Car },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <aside className="w-60 bg-ink-surface border-r border-ink-border flex flex-col">
      <div className="px-6 py-6 border-b border-ink-border">
        <h1 className="font-display text-xl text-text-primary">Andheri West</h1>
        <p className="text-xs text-text-tertiary mt-1">Parking Management</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors duration-150 ${
                isActive
                  ? 'text-brass border-l-[3px] border-brass bg-ink-elevated/50'
                  : 'text-text-secondary hover:text-text-primary border-l-[3px] border-transparent'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-border p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-brass/20 flex items-center justify-center">
            <span className="text-brass text-sm font-medium">
              {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'PK'}
            </span>
          </div>
          <div>
            <p className="text-sm text-text-primary font-medium">{user?.name || 'Parking Owner'}</p>
            <p className="text-xs text-text-tertiary capitalize">{user?.role?.toLowerCase() || 'owner'}</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-tertiary hover:text-danger transition-colors duration-150 rounded-md"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};