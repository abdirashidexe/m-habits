import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

/**
 * Circular streak badge (filled ring when value > 0).
 * @param {{ value: number, size?: number }} props
 */
export function StreakRing({ value, size = 52 }) {
  const active = value > 0;
  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: active ? colors.primary : colors.divider,
          backgroundColor: active ? colors.surface : colors.background,
        },
      ]}
    >
      <Text style={[typography.bodySmall, styles.num]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
