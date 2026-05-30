import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { UnistylesRuntime } from 'react-native-unistyles';

type ThemeMode = 'system' | 'light' | 'dark';

interface PreferencesContextData {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const PreferencesContext = createContext<PreferencesContextData>({} as PreferencesContextData);

const THEME_KEY = 'medalert_theme_mode';

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

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

  return (
    <PreferencesContext.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
