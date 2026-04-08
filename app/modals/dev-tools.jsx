import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subDays, startOfDay } from 'date-fns';

import { useApp, ActionTypes } from '../../context/AppContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { isHabitDueOnDate } from '../../utils/streak';
import { eachDayInclusive, toLocalDateString } from '../../utils/dates';
import { now, nowIso } from '../../utils/now';

function isValidYmd(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.trim());}

export default function DevToolsModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, dispatch } = useApp();

  const [devDate, setDevDate] = useState(state.devDateOverride || '');

  const close = () => router.back();

  const effectiveToday = startOfDay(now());

  const applyDevDate = () => {
    const v = devDate.trim();
    if (!v) {
      dispatch({ type: ActionTypes.SET_DEV_DATE_OVERRIDE, payload: null });
      return;
    }
    if (!isValidYmd(v)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD.', [{ text: 'OK' }]);
      return;
    }
    dispatch({ type: ActionTypes.SET_DEV_DATE_OVERRIDE, payload: v });
  };

  const inject7DaysCompleted = () => {
    const days = eachDayInclusive(subDays(effectiveToday, 6), effectiveToday);
    const iso = nowIso();

    const habitLogs = [...state.habitLogs];
    const habitIndex = new Map(habitLogs.map((l) => [`${l.habitId}_${l.date}`, l]));

    for (const h of state.habits.filter((x) => x.type === 'custom')) {
      for (const day of days) {
        if (!isHabitDueOnDate(h, day)) continue;
        const ds = toLocalDateString(day);
        const key = `${h.id}_${ds}`;
        if (habitIndex.has(key)) continue;
        const entry = { habitId: h.id, date: ds, completed: true, completedAt: iso };
        habitIndex.set(key, entry);
        habitLogs.push(entry);
      }
    }

    const quranLogs = [...state.quranLogs];
    const qSet = new Set(quranLogs.map((q) => q.date));
    for (const day of days) {
      const ds = toLocalDateString(day);
      if (!qSet.has(ds)) {
        qSet.add(ds);
        quranLogs.push({ date: ds, completed: true });
      }
    }
    quranLogs.sort((a, b) => a.date.localeCompare(b.date));

    dispatch({ type: ActionTypes.SET_HABIT_LOGS, payload: habitLogs });
    dispatch({ type: ActionTypes.SET_QURAN_LOGS, payload: quranLogs });
    Alert.alert('Injected', 'Added 7 days of completed logs for all habits (and Quran).', [
      { text: 'OK' },
    ]);
  };

  const injectMissedYesterday = () => {
    const y = subDays(effectiveToday, 1);
    const yStr = toLocalDateString(y);

    const habitLogs = [...state.habitLogs];
    const habitIndex = new Map(habitLogs.map((l) => [`${l.habitId}_${l.date}`, l]));
    for (const h of state.habits.filter((x) => x.type === 'custom')) {
      if (!isHabitDueOnDate(h, y)) continue;
      const key = `${h.id}_${yStr}`;
      const existing = habitIndex.get(key);
      if (existing) {
        existing.completed = false;
        existing.completedAt = null;
      } else {
        habitLogs.push({ habitId: h.id, date: yStr, completed: false, completedAt: null });
      }
    }

    const quranLogs = state.quranLogs.filter((q) => q.date !== yStr);

    dispatch({ type: ActionTypes.SET_HABIT_LOGS, payload: habitLogs });
    dispatch({ type: ActionTypes.SET_QURAN_LOGS, payload: quranLogs });
    Alert.alert('Injected', 'Marked yesterday as missed (and removed Quran completion yesterday).', [
      { text: 'OK' },
    ]);
  };

  const clearLogsOnly = () => {
    Alert.alert('Clear logs?', 'This clears all logs, but keeps habits and your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear logs',
        style: 'destructive',
        onPress: () => {
          dispatch({ type: ActionTypes.SET_HABIT_LOGS, payload: [] });
          dispatch({ type: ActionTypes.SET_QURAN_LOGS, payload: [] });
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topBar}>
        <View style={styles.spacer} />
        <Text style={[typography.heading, styles.title]}>Dev Tools</Text>
        <Pressable onPress={close} style={styles.closeBtn} accessibilityLabel="Close">
          <Text style={[typography.heading, styles.closeTxt]}>×</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, shadows.card]}>
          <Text style={[typography.subheading, styles.cardTitle]}>Date override</Text>
          <Text style={[typography.caption, styles.help]}>
            Set `nur_dev_date` to override time in the app. Clear the field to disable.
          </Text>
          <Input
            label="Override date (YYYY-MM-DD)"
            value={devDate}
            onChangeText={setDevDate}
            placeholder="2026-04-07"
          />
          <Button title="Apply" onPress={applyDevDate} />
        </View>

        <View style={[styles.card, shadows.card]}>
          <Text style={[typography.subheading, styles.cardTitle]}>Streak testing</Text>
          <Text style={[typography.caption, styles.help]}>
            These actions affect logs only (habits and profile are preserved).
          </Text>
          <Button title="Inject 7 days completed (all habits)" onPress={inject7DaysCompleted} />
          <View style={{ height: spacing.sm }} />
          <Button title="Inject missed yesterday (break streaks)" variant="secondary" onPress={injectMissedYesterday} />
          <View style={{ height: spacing.sm }} />
          <Button title="Clear all logs" variant="ghost" onPress={clearLogsOnly} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  spacer: { width: 40 },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    color: colors.textSecondary,
    fontSize: 28,
    lineHeight: 32,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  help: {
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
});

