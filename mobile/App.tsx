import React, { useEffect, useState, useRef } from 'react';
import { View, Image, Animated, StatusBar as RNStatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import { PreferencesProvider } from './src/contexts/ThemeContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AppNavigator } from './src/navigation/AppNavigator';
import { setupNotificationHandlers } from './src/services/pushService';
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles';
import { StyleSheet } from 'react-native-unistyles';
import { buildNavTheme } from './src/styles/navTheme';

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.1, duration: 400, useNativeDriver: true }),
      ]).start(() => onFinish());
    }, 1800);

    return () => clearTimeout(timer);
  }, [opacity, scale, onFinish]);

  return (
    <View style={styles.splash}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require('./assets/images/logo.png')}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const cleanup = setupNotificationHandlers();
    return cleanup;
  }, []);

  const { rt, theme } = useUnistyles();
  const isDark = rt.themeName === 'dark';
  const navTheme = buildNavTheme(isDark, theme as unknown as Record<string, string>);

  return (
    <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <PreferencesProvider>
        <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <RNStatusBar
            barStyle={isDark ? 'light-content' : 'dark-content'}
            backgroundColor="transparent"
            translucent
          />
          <AppNavigator />
          {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        </NavigationContainer>
      </AuthProvider>
    </PreferencesProvider>
    </ErrorBoundary>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create(theme => ({
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.backgroundApp,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
}));
