import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';
import { useNurTheme } from '../hooks/useNurTheme';

/**
 * @param {{ compact?: boolean, style?: object }} props
 */
export function PremiumBadge({ compact = false, style }) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radii } = useNurTheme();
  const styles = makeStyles({ colors, spacing, radii });
  return (
    <View style={[styles.wrap, compact && styles.compact, style]}>
      <Text style={[typography.caption, styles.text]}>{t('premium.badge')}</Text>
    </View>
  );
}

function makeStyles({ colors, spacing, radii }) {
  return StyleSheet.create({
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
}
