import { TextStyle, Platform } from 'react-native';

export const typography = {
  display: {
    fontSize: 48,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
    }),
    fontWeight: '400',
    letterSpacing: -0.02,
  } as TextStyle,
  h1: {
    fontSize: 28,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
    }),
    fontWeight: '400',
  } as TextStyle,
  h2: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '500',
    letterSpacing: 0.08,
    textTransform: 'uppercase',
  } as TextStyle,
  h3: {
    fontSize: 15,
    fontFamily: 'System',
    fontWeight: '500',
  } as TextStyle,
  body: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '400',
  } as TextStyle,
  label: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '400',
  } as TextStyle,
  micro: {
    fontSize: 11,
    fontFamily: 'System',
    fontWeight: '400',
  } as TextStyle,
  mono: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
    }),
    fontWeight: '400',
  } as TextStyle,
  monoLarge: {
    fontSize: 32,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
    }),
    fontWeight: '400',
  } as TextStyle,
};