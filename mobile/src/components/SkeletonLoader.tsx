import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadiusSize?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadiusSize = 8,
  style,
}: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius: borderRadiusSize,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface CardSkeletonProps {
  lines?: number;
}

export function CardSkeleton({ lines = 3 }: CardSkeletonProps) {
  return (
    <View style={styles.card}>
      <SkeletonLoader width="60%" height={20} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLoader
          key={i}
          width={i === lines - 2 ? '40%' : '80%'}
          height={14}
          style={{ marginTop: 10 }}
        />
      ))}
    </View>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  skeleton: {
    backgroundColor: theme.surfaceHigh,
  },
  card: {
    backgroundColor: theme.surfaceCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  list: {
    padding: 20,
  },
}));
