export const darkTheme = {
  colors: {
    background: '#0D0D0D',
    surface: '#161616',
    surfaceElevated: '#1E1E1E',
    border: '#2A2A2A',
    borderActive: '#3D3D3D',

    textPrimary: '#F0EDE8',
    textSecondary: '#8A8680',
    textTertiary: '#5A5754',

    accent: '#C8A97E',
    accentSuccess: '#4CAF7D',
    accentDanger: '#E05A5A',
    accentWarning: '#D4944A',
    accentInfo: '#5A8FBF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    pill: 9999,
  },
};

export const lightTheme = {
  ...darkTheme,
  colors: {
    background: '#F5F3EF',
    surface: '#FFFFFF',
    surfaceElevated: '#FAFAF8',
    border: '#E5E2DC',
    borderActive: '#D5D2DC',

    textPrimary: '#1A1917',
    textSecondary: '#6B6966',
    textTertiary: '#9A9693',

    accent: '#8B6B3D',
    accentSuccess: '#3A9A68',
    accentDanger: '#C44A4A',
    accentWarning: '#B87F3A',
    accentInfo: '#4A7FAF',
  },
};

export type Theme = typeof darkTheme;