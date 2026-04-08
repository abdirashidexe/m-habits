import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radii, shadows } from '../theme';

/**
 * @param {{
 *   name: string,
 *   streak: number,
 *   atRisk: boolean,
 *   completed: boolean,
 *   onToggle: () => void,
 * }} props
 */
export function HabitCard({ name, streak, atRisk, completed, onToggle }) {
  const fire = streak > 2;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <View
      style={[
        styles.card,
        shadows.card,
        completed && styles.cardDone,
        atRisk && !completed && styles.cardRisk,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[typography.subheading, styles.name]}>{name}</Text>
          <View style={styles.meta}>
            <Text style={[typography.caption, styles.streak]}>
              {fire ? '🔥 ' : ''}
              {streak} day streak
            </Text>
            {atRisk && !completed ? (
              <Text style={[typography.caption, styles.risk]}> · At risk</Text>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => [
            styles.check,
            completed && styles.checkOn,
            pressed && styles.checkPressed,
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completed }}
        >
          <Text style={[typography.heading, completed ? styles.checkMark : styles.checkEmpty]}>
            {completed ? '✓' : ''}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardDone: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primaryLight,
  },
  cardRisk: {
    borderColor: colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  name: {
    color: colors.textPrimary,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  streak: {
    color: colors.textSecondary,
  },
  risk: {
    color: colors.accent,
    fontWeight: '600',
  },
  check: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  checkOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkPressed: {
    opacity: 0.85,
  },
  checkMark: {
    color: colors.background,
  },
  checkEmpty: {
    color: 'transparent',
  },
});
