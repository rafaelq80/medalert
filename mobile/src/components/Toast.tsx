import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;

  const bgColor = type === 'success'
    ? styles.bgSuccess.backgroundColor
    : type === 'error'
    ? styles.bgError.backgroundColor
    : styles.bgInfo.backgroundColor;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        dismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-100);
    }
  }, [visible, duration, translateY]);

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }, [translateY, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={dismiss} activeOpacity={0.8}>
        <Text style={styles.icon}>{ICONS[type]}</Text>
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  bgSuccess: { backgroundColor: '#c8e6c9' },
  bgError: { backgroundColor: '#ffcdd2' },
  bgInfo: { backgroundColor: '#bbdefb' },
}));
