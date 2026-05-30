import React, { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

// Simple connectivity check using fetch
async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const translateY = useState(new Animated.Value(-50))[0];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const check = async () => {
      const online = await checkConnectivity();
      setIsOffline(!online);
    };

    check();
    interval = setInterval(check, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOffline ? 0 : -50,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, translateY]);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>Sem conexão com a internet</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.alertWarning,
    paddingVertical: 8,
    paddingHorizontal: 20,
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}));
