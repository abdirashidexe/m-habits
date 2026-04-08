import React, { useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  startOfWeek,
  addDays,
  isSameDay,
  startOfDay,
  isBefore,
  isAfter,
  parseISO,
  isValid,
  differenceInCalendarDays,
} from 'date-fns';

import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../../components/ProgressBar';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import {
  isHabitDueOnDate,
  longestStreakEverForHabit,
  longestDailyStreakFromPredicate,
  calculateQuranStreakState,
} from '../../utils/streak';
import { toLocalDateString } from '../../utils/dates';
import { now } from '../../utils/now';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** @param {{ date: string, completed: true }[]} logs */
function quranLogsForStreak(logs) {
  return logs.map((q) => ({ ...q, pagesRead: q.completed ? 1 : 0 }));
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
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

  const bestStreaks = useMemo(() => {
    const rows = customHabits.map((h) => ({
      name: h.name,
      longest: longestStreakEverForHabit(h.id, h, state.habitLogs),
    }));
    const qLong = longestDailyStreakFromPredicate((ds) => {
      const log = state.quranLogs.find((q) => q.date === ds);
      return Boolean(log?.completed);
    }, today);
    rows.push({ name: 'Quran', longest: qLong });
    rows.sort((a, b) => b.longest - a.longest);
    return rows.slice(0, 3);
  }, [customHabits, state.habitLogs, state.quranLogs, today]);

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

  const quranStreakLogs = useMemo(
    () => quranLogsForStreak(state.quranLogs),
    [state.quranLogs]
  );
  const qCurrent = calculateQuranStreakState(quranStreakLogs, today);
  const qLongestEver = longestDailyStreakFromPredicate((ds) => {
    const log = state.quranLogs.find((q) => q.date === ds);
    return Boolean(log?.completed);
  }, today);

  const totalDaysCompleted = state.quranLogs.filter((q) => q.completed).length;

  const joinedAt = state.userProfile.joinedAt;
  const daysSinceJoining = useMemo(() => {
    if (!joinedAt || !isValid(parseISO(joinedAt))) {
      return Math.max(1, 1);
    }
    const j = startOfDay(parseISO(joinedAt));
    const t = startOfDay(today);
    return Math.max(1, differenceInCalendarDays(t, j) + 1);
  }, [joinedAt, today]);

  const consistencyPct =
    daysSinceJoining > 0 ? Math.min(100, (totalDaysCompleted / daysSinceJoining) * 100) : 0;

  const medals = ['🥇', '🥈', '🥉'];

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

      <Text style={[typography.heading, styles.section]}>Quran</Text>
      <View style={[styles.card, shadows.card]}>
        <Text style={[typography.body, styles.line]}>
          Current Quran streak: {qCurrent.currentStreak} day{qCurrent.currentStreak === 1 ? '' : 's'}
        </Text>
        <Text style={[typography.body, styles.line]}>
          Longest Quran streak ever: {qLongestEver} day{qLongestEver === 1 ? '' : 's'}
        </Text>
        <Text style={[typography.body, styles.line]}>
          Total days completed (all time): {totalDaysCompleted}
        </Text>
        <Text style={[typography.body, styles.line]}>
          Consistency (completed days ÷ days since joining)
        </Text>
        <ProgressBar progress={consistencyPct / 100} style={styles.bar} />
        <Text style={[typography.caption, styles.pctLbl]}>{consistencyPct.toFixed(0)}%</Text>
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
  bar: {
    marginTop: spacing.md,
  },
  pctLbl: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
