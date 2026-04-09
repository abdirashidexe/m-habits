import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useFocusEffect } from '@react-navigation/native';
import {
  addDays,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfWeek
} from 'date-fns';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PremiumBadge } from '../../components/PremiumBadge';
import { useApp } from '../../context/AppContext';
import { useNurTheme } from '../../hooks/useNurTheme';
import { toLocalDateString } from '../../utils/dates';
import { now } from '../../utils/now';
import { isHabitDueOnDate, longestStreakEverForHabit } from '../../utils/streak';

export default function StatsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const { colors, radii, shadows, spacing, typography } = useNurTheme();
  const styles = makeStyles({ colors, radii, spacing });
  const premium = state.userProfile.isPremium;
  const [today, setToday] = useState(() => now());
  useFocusEffect(
    useCallback(() => {
      setToday(now());
    }, [])
  );

  const customHabits = useMemo(
    () => state.habits.filter((h) => h.type === 'custom'),
    [state.habits]
  );

  const dayLetters = useMemo(
    () => [
      t('stats.dayLetterSun'),
      t('stats.dayLetterMon'),
      t('stats.dayLetterTue'),
      t('stats.dayLetterWed'),
      t('stats.dayLetterThu'),
      t('stats.dayLetterFri'),
      t('stats.dayLetterSat'),
    ],
    [t]
  );

  const bestStreaks = useMemo(() => {
    const rows = customHabits.map((h) => ({
      name: h.name,
      longest: longestStreakEverForHabit(h.id, h, state.habitLogs),
    }));
    rows.sort((a, b) => b.longest - a.longest);
    return rows.slice(0, 3);
  }, [customHabits, state.habitLogs]);

  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekDays = useMemo(() => [...Array(7)].map((_, i) => addDays(weekStart, i)), [weekStart]);

  const gridDots = useMemo(() => {
    return weekDays.map((day) => {
      const dateStr = toLocalDateString(day);
      const isTodayCol = isSameDay(day, today);
      const d0 = startOfDay(day);
      const t0 = startOfDay(today);
      const isPast = isBefore(d0, t0);
      const isFuture = isAfter(d0, t0);
      const dots = [];
      for (const h of customHabits) {
        if (!isHabitDueOnDate(h, day)) continue;
        const log = state.habitLogs.find((l) => l.habitId === h.id && l.date === dateStr);
        const done = Boolean(log?.completed);
        let fill = 'missed';
        if (done) fill = 'done';
        else if (isTodayCol) fill = 'pending';
        else if (isFuture) fill = 'future';
        else if (isPast) fill = 'missed';
        dots.push({ fill, id: h.id });
      }
      return { day, dateStr, isTodayCol, dots };
    });
  }, [weekDays, customHabits, state.habitLogs, today]);

  const medalIcons = /** @type {{ name: any, color: string }[]} */ ([
    { name: 'trophy', color: colors.premiumGold },
    { name: 'medal', color: colors.textSecondary },
    { name: 'award', color: colors.textMuted },
  ]);

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top + spacing.md }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleBlock}>
        <Text style={[typography.displayMedium, styles.screenTitle]}>{t('stats.title')}</Text>
        <Text style={[typography.subtext2, typography.caption, styles.subUnderTitle]}>
          {t('stats.subtitle')}
        </Text>
      </View>

      <Text style={[typography.heading, styles.section]}>{t('stats.yourStreaks')}</Text>
      <View style={[styles.card, shadows.card]}>
        {bestStreaks.length > 0 ? bestStreaks.map((row, i) => (
          <View
            key={row.name + i}
            style={[styles.rankRow, i === bestStreaks.length - 1 && styles.rankRowLast]}
          >
            <View style={styles.medal}>
              <FontAwesome6
                name={(medalIcons[i]?.name || 'award')}
                size={18}
                color={medalIcons[i]?.color || colors.textMuted}
              />
              <Text style={[typography.caption, styles.rankBadge]}>#{i + 1}</Text>
            </View>
            <View style={styles.rankMain}>
              <Text style={[typography.body, styles.rankName]}>{row.name}</Text>
              <Text style={[typography.caption, styles.rankVal]}>
                {t('stats.longest', { count: row.longest })}
              </Text>
            </View>
          </View>
        )) : <Text style={[typography.body, styles.emptyStreaks]}>{t('stats.noStreaks')}</Text>}
      </View>

      <View style={styles.sectionSpacer} />
      <Text style={[typography.heading, styles.section]}>{t('stats.weekGlance')}</Text>
      <View style={[styles.card, shadows.card]}>
        <View style={styles.gridRow}>
          {gridDots.map((col, idx) => (
            <View key={col.dateStr} style={styles.col}>
              <Text style={[typography.label, styles.colLbl]}>{dayLetters[idx]}</Text>
              <View style={styles.dotCol}>
                {col.dots.map((d) => (
                  <View
                    key={d.id}
                    style={[
                      styles.dot,
                      d.fill === 'done' && styles.dotFill,
                      d.fill === 'pending' && styles.dotHalf,
                      d.fill === 'future' && styles.dotFuture,
                    ]}
                  />
                ))}
                {col.dots.length === 0 ? (
                  <Text style={[typography.caption, styles.noDots]}>—</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
        {!premium ? (
          <View style={[styles.premiumCard, shadows.card]}>
            <PremiumBadge />
            <Text style={[typography.subheading, styles.premTitle]}>{t('stats.premiumTitle')}</Text>
            <Text style={[typography.bodySmall, styles.premHint]}>{t('stats.premiumHint')}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

function makeStyles({ colors, radii, spacing }) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
    },
    titleBlock: {
      width: '100%',
      alignItems: 'center',
    },
    screenTitle: {
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 0,
    },
    subUnderTitle: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    emptyStreaks: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
    section: {
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    sectionSpacer: {
      marginTop: spacing.md,
      paddingTop: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.divider,
      marginBottom: spacing.sm,
    },
    rankRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    rankRowLast: {
      borderBottomWidth: 0,
    },
    medal: {
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankBadge: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 10,
      lineHeight: 12,
    },
    rankMain: {
      flex: 1,
    },
    rankName: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    rankVal: {
      color: colors.textSecondary,
      marginTop: 2,
    },
    gridRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    col: {
      flex: 1,
      alignItems: 'center',
    },
    colLbl: {
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    dotCol: {
      alignItems: 'center',
      gap: 4,
      minHeight: 80,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.background,
    },
    dotFill: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dotHalf: {
      backgroundColor: colors.accent,
      opacity: 0.45,
      borderColor: colors.accent,
    },
    dotFuture: {
      opacity: 0.35,
    },
    noDots: {
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
    premiumCard: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 2,
      borderColor: colors.premiumGold,
      marginTop: spacing.md,
    },
    premTitle: {
      color: colors.textPrimary,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    premHint: {
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
}
