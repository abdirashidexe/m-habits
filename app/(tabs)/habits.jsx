import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp, ActionTypes } from '../../context/AppContext';
import { EmptyState } from '../../components/EmptyState';
import { PremiumBadge } from '../../components/PremiumBadge';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { calculateStreak, longestStreakEverForHabit } from '../../utils/streak';
import { cancelHabitReminder } from '../../utils/notifications';

function freqLabel(h) {
  if (h.frequency === 'daily') return 'Daily';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const parts = (h.specificDays || []).map((i) => days[i]).filter(Boolean);
  return parts.length ? parts.join(', ') : 'Specific days';
}

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const premium = state.userProfile.isPremium;

  const customHabits = useMemo(
    () => state.habits.filter((h) => h.type === 'custom'),
    [state.habits]
  );

  const openAdd = () => {
    if (!premium && customHabits.length >= 3) {
      Alert.alert(
        'Nur Premium',
        'Free accounts can track up to 3 custom habits. Unlock Premium for unlimited habits.',
        [{ text: 'OK' }]
      );
      return;
    }
    router.push('/modals/add-habit');
  };

  const confirmDelete = (h) => {
    Alert.alert('Delete habit', `Remove "${h.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelHabitReminder(h.id);
          dispatch({ type: ActionTypes.DELETE_HABIT, payload: h.id });
        },
      },
    ]);
  };

  const openEdit = (h, locked) => {
    if (locked) {
      Alert.alert(
        'Nur Premium',
        'This habit is locked on the free plan. Unlock Premium to manage unlimited habits.',
        [{ text: 'OK' }]
      );
      return;
    }
    router.push({ pathname: '/modals/add-habit', params: { id: h.id } });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <Text style={[typography.displayMedium, styles.title]}>Habits</Text>
      <Text style={[typography.body, styles.sub]}>Build rhythms that stay with you.</Text>

      {customHabits.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            title="No habits yet"
            message="Tap the + button to create your first habit. Small steps, blessed consistency."
          />
          <Text style={[typography.caption, styles.arrow]}>↓</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {customHabits.map((h, index) => {
            const locked = !premium && index >= 3;
            const streak = calculateStreak(h.id, state.habitLogs, h);
            const longest = longestStreakEverForHabit(h.id, h, state.habitLogs);
            const RowWrap = locked ? Pressable : View;
            const rowWrapProps = locked
              ? { onPress: () => openEdit(h, true), accessibilityRole: 'button' }
              : {};
            return (
              <RowWrap
                key={h.id}
                {...rowWrapProps}
                style={[styles.row, shadows.card, locked && styles.rowLocked]}
              >
                <View style={styles.rowMain}>
                  <View style={styles.rowTop}>
                    <Text style={[typography.subheading, styles.name]}>{h.name}</Text>
                    {locked ? <PremiumBadge compact /> : null}
                  </View>
                  <Text style={[typography.caption, styles.meta]}>{freqLabel(h)}</Text>
                  <Text style={[typography.caption, styles.streak]}>
                    Streak {streak.currentStreak} · Best {longest}
                  </Text>
                </View>
                {!locked ? (
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => openEdit(h, false)}
                      style={styles.iconBtn}
                      accessibilityLabel="Edit habit"
                    >
                      <Text style={styles.icon}>✎</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDelete(h)}
                      style={styles.iconBtn}
                      accessibilityLabel="Delete habit"
                    >
                      <Text style={[styles.icon, styles.trash]}>🗑</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={[typography.caption, styles.lock]}>🔒</Text>
                )}
              </RowWrap>
            );
          })}
        </ScrollView>
      )}

      <Pressable style={[styles.fab, shadows.modal]} onPress={openAdd} accessibilityLabel="Add habit">
        <Text style={[typography.displayMedium, styles.fabPlus]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  title: {
    color: colors.textPrimary,
  },
  sub: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 120,
  },
  arrow: {
    textAlign: 'center',
    color: colors.accent,
    marginTop: spacing.md,
    fontSize: 28,
  },
  list: {
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  rowLocked: {
    borderColor: colors.premiumGold,
    opacity: 0.85,
  },
  rowMain: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    color: colors.textPrimary,
  },
  meta: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  streak: {
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: spacing.sm,
  },
  icon: {
    fontSize: 20,
    color: colors.primary,
  },
  trash: {
    color: colors.danger,
  },
  lock: {
    color: colors.premiumGold,
    fontSize: 22,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPlus: {
    color: colors.background,
    marginTop: -2,
  },
});
