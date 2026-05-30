import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { UnistylesRuntime } from 'react-native-unistyles';

type ThemeMode = 'system' | 'light' | 'dark';

interface PreferencesContextData {
  themeMode: ThemeMode;
  fontScaleOffset: number;
  setThemeMode: (mode: ThemeMode) => void;
  setFontScale: (offset: number) => void;
}

const PreferencesContext = createContext<PreferencesContextData>({} as PreferencesContextData);

const THEME_KEY = 'medalert_theme_mode';
const FONT_KEY = 'medalert_font_scale';

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [fontScaleOffset, setFontScaleOffset] = useState(0);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const saved = await SecureStore.getItemAsync(THEME_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved);
        applyTheme(saved);
      }
      const scale = await SecureStore.getItemAsync(FONT_KEY);
      if (scale) setFontScaleOffset(parseInt(scale, 10) || 0);
    } catch {}
  };

  const applyTheme = (mode: ThemeMode) => {
    try {
      if (mode === 'system') {
        if (typeof UnistylesRuntime.setAdaptiveThemes === 'function') {
          UnistylesRuntime.setAdaptiveThemes(true);
        }
      } else {
        if (typeof UnistylesRuntime.setAdaptiveThemes === 'function') {
          UnistylesRuntime.setAdaptiveThemes(false);
        }
        if (typeof UnistylesRuntime.setTheme === 'function') {
          UnistylesRuntime.setTheme(mode);
        }
      }
    } catch (e) {
      console.warn('Theme switch error:', e);
    }
  };

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    applyTheme(mode);
    try { await SecureStore.setItemAsync(THEME_KEY, mode); } catch {}
  }, []);

  const setFontScale = useCallback(async (offset: number) => {
    setFontScaleOffset(offset);
    // Font scale is applied via the fontScaleOffset value that components read
    // Components that need to scale text should use: fontSize: baseSize + fontScaleOffset
    try { await SecureStore.setItemAsync(FONT_KEY, offset.toString()); } catch {}
  }, []);

  return (
    <PreferencesContext.Provider value={{ themeMode, fontScaleOffset, setThemeMode, setFontScale }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}

// Backward compat exports
export const useTheme = usePreferences;
export const useAppTheme = usePreferences;
export const ThemeProvider = PreferencesProvider;
