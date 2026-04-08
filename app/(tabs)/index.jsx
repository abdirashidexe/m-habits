import React, { useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useApp, ActionTypes } from '../../context/AppContext';
import { HabitCard } from '../../components/HabitCard';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import {
  formatDateDisplay,
  formatHijriDisplay,
  toLocalDateString,
  getDayOfYear,
} from '../../utils/dates';
import { calculateStreak, isHabitDueOnDate, calculateQuranStreakState } from '../../utils/streak';
import { quoteForDay } from '../../constants/motivation';
import { now, nowIso } from '../../utils/now';

function greetingPeriod(date) {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/** @param {{ date: string, completed: true }[]} logs */
function quranLogsForStreak(logs) {
  return logs.map((q) => ({ ...q, pagesRead: q.completed ? 1 : 0 }));
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [today, setToday] = useState(() => now());
  useFocusEffect(
    useCallback(() => {
      setToday(now());
    }, [])
  );
  const todayStr = toLocalDateString(today);

  const customHabits = useMemo(
    () => state.habits.filter((h) => h.type === 'custom'),
    [state.habits]
  );

  const dueTodayList = useMemo(
    () => customHabits.filter((h) => isHabitDueOnDate(h, today)),
    [customHabits, today]
  );

  const quranStreakLogs = useMemo(() => quranLogsForStreak(state.quranLogs), [state.quranLogs]);
  const qStreak = calculateQuranStreakState(quranStreakLogs, today);
  const quranDoneToday = Boolean(state.quranLogs.some((q) => q.date === todayStr && q.completed));

  const stats = useMemo(() => {
    let completed = quranDoneToday ? 1 : 0;
    let activeStreaks = qStreak.currentStreak > 0 ? 1 : 0;
    for (const h of dueTodayList) {
      const s = calculateStreak(h.id, state.habitLogs, h, today);
      if (s.completedToday) completed += 1;
      if (s.currentStreak > 0) activeStreaks += 1;
    }
    return {
      due: dueTodayList.length + 1,
      completed,
      activeStreaks,
    };
  }, [dueTodayList, quranDoneToday, qStreak.currentStreak, state.habitLogs, today]);

  const initial = (state.userProfile.name || '?').trim().charAt(0).toUpperCase();

  const toggleHabit = (habitId, completed) => {
    dispatch({
      type: ActionTypes.TOGGLE_HABIT_LOG,
      payload: { habitId, date: todayStr, completed: !completed, nowIso: nowIso() },
    });
  };

  const markQuranComplete = () => {
    if (!quranDoneToday) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dispatch({
        type: ActionTypes.UPSERT_QURAN_LOG,
        payload: { date: todayStr, completed: true },
      });
      return;
    }
    Alert.alert('Undo Quran completion?', 'Remove today as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Undo',
        style: 'destructive',
        onPress: () => {
          dispatch({
            type: ActionTypes.SET_QURAN_LOGS,
            payload: state.quranLogs.filter((q) => q.date !== todayStr),
          });
        },
      },
    ]);
  };

  const quote = quoteForDay(getDayOfYear(today));

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top + spacing.md }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[typography.subheading, styles.salam]}>السلام عليكم</Text>
          <Text style={[typography.body, styles.greet]}>
            Good {greetingPeriod(today)}, {state.userProfile.name || 'friend'}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.avatar}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Text style={[typography.heading, styles.avatarTxt]}>{initial}</Text>
        </Pressable>
      </View>

      <View style={[styles.card, shadows.card]}>
        <Text style={[typography.subheading, styles.dateGreg]}>{formatDateDisplay(today)}</Text>
        <Text style={[typography.bodySmall, styles.dateHij]}>{formatHijriDisplay(today)}</Text>
        <View style={styles.pills}>
          <View style={styles.pill}>
            <Text style={[typography.caption, styles.pillLabel]}>Habits due</Text>
            <Text style={[typography.subheading, styles.pillVal]}>{stats.due}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={[typography.caption, styles.pillLabel]}>Completed</Text>
            <Text style={[typography.subheading, styles.pillVal]}>{stats.completed}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={[typography.caption, styles.pillLabel]}>Streaks active</Text>
            <Text style={[typography.subheading, styles.pillVal]}>{stats.activeStreaks}</Text>
          </View>
        </View>
      </View>

      <Text style={[typography.heading, styles.sectionTitle]}>Today&apos;s habits</Text>
      {dueTodayList.length === 0 ? (
        <Text style={[typography.body, styles.emptyH]}>No custom habits due today.</Text>
      ) : null}
      <HabitCard
        name="Quran"
        streak={qStreak.currentStreak}
        atRisk={qStreak.atRisk && !quranDoneToday}
        completed={quranDoneToday}
        onToggle={markQuranComplete}
      />
      {dueTodayList.map((h) => {
        const s = calculateStreak(h.id, state.habitLogs, h, today);
        const log = state.habitLogs.find((l) => l.habitId === h.id && l.date === todayStr);
        const done = Boolean(log?.completed);
        return (
          <HabitCard
            key={h.id}
            name={h.name}
            streak={s.currentStreak}
            atRisk={s.atRisk}
            completed={done}
            onToggle={() => toggleHabit(h.id, done)}
          />
        );
      })}

      <View style={styles.footer}>
        <Text style={[typography.bodySmall, styles.quote]}>{quote}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  salam: {
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  greet: {
    color: colors.textSecondary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  dateGreg: {
    color: colors.textPrimary,
  },
  dateHij: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  pillLabel: {
    color: colors.textMuted,
  },
  pillVal: {
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  emptyH: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginTop: spacing.md,
  },
  quote: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});
