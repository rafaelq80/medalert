import { StyleSheet } from 'react-native-unistyles';

const lightTheme = {
  // Surface
  backgroundApp: '#F8F9FA',
  surface: '#f9f9ff',
  surfaceCard: '#FFFFFF',
  surfaceLow: '#f2f3fc',
  surfaceHigh: '#e7e8f0',
  // Text
  onSurface: '#191c21',
  onSurfaceVariant: '#424752',
  onTag: '#191c21',
  // Borders
  outline: '#727784',
  outlineVariant: '#c2c6d4',
  // Primary
  primary: '#003f87',
  primaryContainer: '#0056b3',
  onPrimary: '#ffffff',
  // Tab active
  tabActive: '#0056b3',
  // Secondary (success)
  secondary: '#006e25',
  secondaryContainer: '#80f98b',
  onSecondary: '#ffffff',
  // Status
  statusPending: '#0056B3',
  statusConfirmed: '#28A745',
  statusDelayed: '#DC3545',
  statusIgnored: '#6C757D',
  alertWarning: '#FD7E14',
  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  // Offline
  offlineBanner: '#FD7E14',
  onOfflineBanner: '#FFFFFF',
  // Inputs — always white bg
  inputBg: '#FFFFFF',
  inputText: '#191c21',
  inputPlaceholder: '#727784',
  // Screen title
  screenTitleColor: '#003f87',
  // Typography tokens
  text: {
    title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
    subtitle: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
    button: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  },
} as const;

const darkTheme = {
  // Surface — cinza suave
  backgroundApp: '#181818',
  surface: '#1e1e1e',
  surfaceCard: '#252525',
  surfaceLow: '#2a2a2a',
  surfaceHigh: '#333333',
  // Text
  onSurface: '#e8e8e8',
  onSurfaceVariant: '#b0b0b0',
  onTag: '#1a1a1a',
  // Borders
  outline: '#555555',
  outlineVariant: '#3a3a3a',
  // Primary
  primary: '#90caf9',
  primaryContainer: '#4da6e8',
  onPrimary: '#0a1929',
  // Tab active — ciano
  tabActive: '#4dd0e1',
  // Secondary
  secondary: '#81c784',
  secondaryContainer: '#1b5e20',
  onSecondary: '#0a2e0a',
  // Status
  statusPending: '#64b5f6',
  statusConfirmed: '#66bb6a',
  statusDelayed: '#ef5350',
  statusIgnored: '#9e9e9e',
  alertWarning: '#ffa726',
  // Error
  error: '#ef9a9a',
  onError: '#3e0000',
  errorContainer: '#5c1010',
  // Offline
  offlineBanner: '#ffa726',
  onOfflineBanner: '#1a1a1a',
  // Inputs — white bg for readability
  inputBg: '#FFFFFF',
  inputText: '#191c21',
  inputPlaceholder: '#727784',
  // Screen title
  screenTitleColor: '#FFFFFF',
  // Typography tokens
  text: {
    title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
    subtitle: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
    button: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  },
} as const;

const appThemes = { light: lightTheme, dark: darkTheme };

// Spacing & layout tokens
export const sp = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  touchMin: 48,
  cardPadding: 16,
  radius: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusFull: 9999,
} as const;

type AppThemes = typeof appThemes;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: appThemes,
  settings: {
    adaptiveThemes: true,
  },
});
