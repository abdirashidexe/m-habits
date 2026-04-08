import React, { useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { startOfWeek, addDays, isSameDay, startOfDay, isBefore, isAfter } from 'date-fns';

import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../../components/ProgressBar';
import { PremiumBadge } from '../../components/PremiumBadge';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import {
  isHabitDueOnDate,
  longestStreakEverForHabit,
  longestDailyStreakFromPredicate,
  calculateQuranStreakState,
} from '../../utils/streak';
import { toLocalDateString, eachDayInclusive } from '../../utils/dates';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const premium = state.userProfile.isPremium;
  const [today, setToday] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      setToday(new Date());
    }, [])
  );

  const customHabits = useMemo(
    () => state.habits.filter((h) => h.type === 'custom'),
    [state.habits]
  );

  const bestStreaks = useMemo(() => {
    const rows = customHabits.map((h) => ({
      name: h.name,
      longest: longestStreakEverForHabit(h.id, h, state.habitLogs),
    }));
    const qLong = longestDailyStreakFromPredicate((ds) => {
      const log = state.quranLogs.find((q) => q.date === ds);
      return Boolean(log && log.pagesRead >= 1);
    }, today);
    rows.push({ name: 'Quran reading', longest: qLong });
    const datesDone = new Set();
    for (const s of state.athkarSessions) {
      if (s.completed) datesDone.add(s.date);
    }
    const aLong = longestDailyStreakFromPredicate((ds) => datesDone.has(ds), today);
    rows.push({ name: 'Athkar (any session)', longest: aLong });
    rows.sort((a, b) => b.longest - a.longest);
    return rows.slice(0, 3);
  }, [customHabits, state.habitLogs, state.quranLogs, state.athkarSessions, today]);

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

  const totalPages = state.quranLogs.reduce((s, q) => s + (q.pagesRead || 0), 0);
  const activeDays = state.quranLogs.filter((q) => q.pagesRead >= 1).length;
  const avgPages = activeDays > 0 ? totalPages / activeDays : 0;
  const qStreak = calculateQuranStreakState(state.quranLogs, today);

  const athkar30 = useMemo(() => {
    const start = addDays(today, -29);
    const days = eachDayInclusive(start, today);
    let hit = 0;
    for (const d of days) {
      const ds = toLocalDateString(d);
      const any = state.athkarSessions.some((s) => s.date === ds && s.completed);
      if (any) hit += 1;
    }
    return days.length > 0 ? hit / days.length : 0;
  }, [state.athkarSessions, today]);

  const medals = ['🥇', '🥈', '🥉'];

  const upgrade = () => {
    Alert.alert(
      'Nur Premium',
      'Unlock full stats history including 30-day Athkar consistency insights.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top + spacing.md }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[typography.displayMedium, styles.title]}>Stats</Text>
      <Text style={[typography.body, styles.sub]}>Reflection, not repetition.</Text>

      <Text style={[typography.heading, styles.section]}>Your best streaks</Text>
      <View style={[styles.card, shadows.card]}>
        {bestStreaks.map((row, i) => (
          <View
            key={row.name + i}
            style={[styles.rankRow, i === bestStreaks.length - 1 && styles.rankRowLast]}
          >
            <Text style={[typography.subheading, styles.medal]}>{medals[i] || '•'}</Text>
            <View style={styles.rankMain}>
              <Text style={[typography.body, styles.rankName]}>{row.name}</Text>
              <Text style={[typography.caption, styles.rankVal]}>
                Longest {row.longest} day{row.longest === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[typography.heading, styles.section]}>This week at a glance</Text>
      <View style={[styles.card, shadows.card]}>
        <View style={styles.gridRow}>
          {gridDots.map((col, idx) => (
            <View key={col.dateStr} style={styles.col}>
              <Text style={[typography.label, styles.colLbl]}>{DAYS[idx]}</Text>
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
          <Text style={[typography.caption, styles.hint]}>
            Free plan: this week view. Premium adds deeper history views.
          </Text>
        ) : null}
      </View>

      <Text style={[typography.heading, styles.section]}>Quran progress</Text>
      <View style={[styles.card, shadows.card]}>
        <Text style={[typography.body, styles.line]}>Total pages logged (all time): {totalPages}</Text>
        <Text style={[typography.body, styles.line]}>
          Average pages per active day: {avgPages.toFixed(1)}
        </Text>
        <Text style={[typography.body, styles.line]}>
          Current Quran streak: {qStreak.currentStreak} day{qStreak.currentStreak === 1 ? '' : 's'}
        </Text>
      </View>

      <Text style={[typography.heading, styles.section]}>Athkar consistency</Text>
      <View style={[styles.card, shadows.card, !premium && styles.lockedCard]}>
        {!premium ? (
          <Pressable onPress={upgrade} style={styles.lockPress}>
            <PremiumBadge style={styles.badge} />
            <Text style={[typography.body, styles.lockTxt]}>
              30-day consistency (Premium) — tap to learn more
            </Text>
            <ProgressBar progress={0} style={styles.barDim} />
          </Pressable>
        ) : (
          <>
            <Text style={[typography.body, styles.line]}>
              Last 30 days: {Math.round(athkar30 * 100)}% of days with at least one Athkar session
              completed
            </Text>
            <ProgressBar progress={athkar30} style={styles.bar} />
          </>
        )}
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
  },
  sub: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  section: {
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
  hint: {
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  line: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  lockedCard: {
    borderColor: colors.premiumGold,
  },
  lockPress: {
    width: '100%',
  },
  badge: {
    marginBottom: spacing.sm,
  },
  lockTxt: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  bar: {
    marginTop: spacing.sm,
  },
  barDim: {
    marginTop: spacing.sm,
    opacity: 0.4,
  },
});
