import React, { useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp, ActionTypes } from '../../context/AppContext';
import { HabitCard } from '../../components/HabitCard';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import {
  formatDateDisplay,
  formatHijriDisplay,
  toLocalDateString,
  getDayOfYear,
} from '../../utils/dates';
import {
  calculateStreak,
  isHabitDueOnDate,
  calculateQuranStreakState,
} from '../../utils/streak';
import { quoteForDay } from '../../constants/motivation';

function greetingPeriod() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [today, setToday] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      setToday(new Date());
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

  const stats = useMemo(() => {
    let completed = 0;
    let activeStreaks = 0;
    for (const h of dueTodayList) {
      const s = calculateStreak(h.id, state.habitLogs, h, today);
      if (s.completedToday) completed += 1;
      if (s.currentStreak > 0) activeStreaks += 1;
    }
    return {
      due: dueTodayList.length,
      completed,
      activeStreaks,
    };
  }, [dueTodayList, state.habitLogs, today]);

  const quranToday = state.quranLogs.find((q) => q.date === todayStr);
  const qPages = quranToday?.pagesRead ?? 0;
  const qStreak = calculateQuranStreakState(state.quranLogs, today);

  const sessionDone = (type) => {
    const s = state.athkarSessions.find((x) => x.type === type && x.date === todayStr);
    return Boolean(s?.completed);
  };

  const initial = (state.userProfile.name || '?').trim().charAt(0).toUpperCase();

  const toggleHabit = (habitId, completed) => {
    dispatch({
      type: ActionTypes.TOGGLE_HABIT_LOG,
      payload: { habitId, date: todayStr, completed: !completed },
    });
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
            Good {greetingPeriod()}, {state.userProfile.name || 'friend'}
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

      <Text style={[typography.heading, styles.sectionTitle]}>Quran reading</Text>
      <View style={[styles.block, shadows.card]}>
        <Text style={[typography.body, styles.blockTxt]}>
          Today: {qPages} page{qPages === 1 ? '' : 's'} logged · Streak {qStreak.currentStreak} days
        </Text>
        <Button
          title="+ Log Reading"
          variant="secondary"
          onPress={() => router.push('/modals/log-quran')}
          style={styles.blockBtn}
        />
      </View>

      <Text style={[typography.heading, styles.sectionTitle]}>Athkar</Text>
      <View style={styles.athkarRow}>
        <Pressable
          style={[styles.athPill, sessionDone('morning') && styles.athPillDone]}
          onPress={() => router.push({ pathname: '/modals/athkar', params: { type: 'morning' } })}
        >
          <Text style={[typography.caption, styles.athTxt]}>Morning</Text>
          <Text style={[typography.label, styles.athState]}>
            {sessionDone('morning') ? 'Done' : 'Open'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.athPill, sessionDone('evening') && styles.athPillDone]}
          onPress={() => router.push({ pathname: '/modals/athkar', params: { type: 'evening' } })}
        >
          <Text style={[typography.caption, styles.athTxt]}>Evening</Text>
          <Text style={[typography.label, styles.athState]}>
            {sessionDone('evening') ? 'Done' : 'Open'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.athPill, sessionDone('night') && styles.athPillDone]}
          onPress={() => router.push({ pathname: '/modals/athkar', params: { type: 'night' } })}
        >
          <Text style={[typography.caption, styles.athTxt]}>Night</Text>
          <Text style={[typography.label, styles.athState]}>
            {sessionDone('night') ? 'Done' : 'Open'}
          </Text>
        </Pressable>
      </View>

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
    borderRadius: radii.lg,
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
  block: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.md,
  },
  blockTxt: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  blockBtn: {
    alignSelf: 'flex-start',
  },
  athkarRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  athPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  athPillDone: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  athTxt: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  athState: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  quote: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});
