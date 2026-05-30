import { DefaultTheme, DarkTheme, type Theme } from '@react-navigation/native';

/**
 * Builds a React Navigation theme from the Unistyles theme tokens.
 * Uses `satisfies` for type safety without losing literal types.
 */
export function buildNavTheme(isDark: boolean, theme: Record<string, string>): Theme {
  const base = isDark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      background: theme.backgroundApp,
      card: theme.surface,
      text: theme.onSurface,
      border: theme.outlineVariant,
      primary: theme.tabActive,
      notification: theme.error,
    },
  } satisfies Theme;
}
