import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../theme';

/**
 * @param {{ compact?: boolean, style?: object }} props
 */
export function PremiumBadge({ compact = false, style }) {
  return (
    <View style={[styles.wrap, compact && styles.compact, style]}>
      <Text style={[typography.caption, styles.text]}>✦ Premium</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.premiumGold,
    backgroundColor: colors.surfaceElevated,
  },
  compact: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  text: {
    color: colors.premiumGold,
    fontWeight: '700',
  },
});
