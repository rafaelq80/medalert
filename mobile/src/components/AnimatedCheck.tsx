import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface AnimatedCheckProps {
  visible: boolean;
  size?: number;
  onComplete?: () => void;
}

export function AnimatedCheck({ visible, size = 60, onComplete }: AnimatedCheckProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Fade out after a moment
        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            scale.setValue(0);
            onComplete?.();
          });
        }, 1200);
      });
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity, onComplete]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <Animated.Text style={[styles.check, { fontSize: size * 0.5 }]}>
        ✓
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    backgroundColor: theme.statusConfirmed,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    elevation: 10,
    shadowColor: theme.statusConfirmed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  check: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
}));
