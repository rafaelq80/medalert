import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  headlineLg: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  headlineMd: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  bodyLg: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
  },
  bodyMd: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  labelLg: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  labelMd: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  statusTag: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
} as const;

export const spacing = {
  touchTargetMin: 48,
  gutter: 16,
  marginMobile: 20,
  stackGap: 12,
  cardPadding: 20,
} as const;

export const borderRadius = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
