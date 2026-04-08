import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

/**
 * @param {{ title: string, message: string, style?: object }} props
 */
export function EmptyState({ title, message, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={[typography.heading, styles.title]}>{title}</Text>
      <Text style={[typography.body, styles.msg]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  msg: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
