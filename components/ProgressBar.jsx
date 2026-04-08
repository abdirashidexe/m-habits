import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radii } from '../theme';

/**
 * @param {{ progress: number, height?: number, style?: object }} props
 * progress: 0..1
 */
export function ProgressBar({ progress, height = 6, style }) {
  const clamped = Math.min(1, Math.max(0, progress));
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withTiming(clamped, { duration: 280 });
  }, [clamped, w]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${w.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { height }, style]}>
      <Animated.View style={[styles.fill, { height }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.divider,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
});
