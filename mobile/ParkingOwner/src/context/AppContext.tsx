import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { darkTheme, lightTheme, Theme } from '../utils/theme';
import { loadAuthToken } from '../services/api';
import { RootState } from '../store';

interface AppContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType>({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <AppContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

// Format number to Indian currency format
export const formatIndianNumber = (num: number): string => {
  const str = num.toString();
  if (str.length <= 3) return str;
  let result = str.slice(-3);
  let remaining = str.slice(0, -3);
  while (remaining.length > 2) {
    result = remaining.slice(-2) + ',' + result;
    remaining = remaining.slice(0, -2);
  }
  return remaining + ',' + result;
};

// Format date to Indian format
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Format time to 12-hour format
export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
};