import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp, ActionTypes } from '../../context/AppContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radii, shadows } from '../../theme';

function parseGoal(raw) {
  const n = parseInt(String(raw).replace(/[^\d]/g, ''), 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 604) return null;
  return n;
}

export default function QuranGoalModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, dispatch } = useApp();

  const initial = state.userProfile.quranDailyGoal ?? 1;
  const [goal, setGoal] = useState(String(initial));

  const goalNum = useMemo(() => parseGoal(goal), [goal]);
  const valid = goalNum !== null;

  const close = () => router.back();

  const save = () => {
    if (!valid || goalNum === null) {
      Alert.alert('Invalid goal', 'Enter a number between 1 and 604.', [{ text: 'OK' }]);
      return;
    }
    dispatch({ type: ActionTypes.SET_QURAN_DAILY_GOAL, payload: goalNum });
    close();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topBar}>
        <View style={styles.spacer} />
        <Text style={[typography.heading, styles.title]}>Quran goal</Text>
        <Pressable onPress={close} style={styles.closeBtn} accessibilityLabel="Close">
          <Text style={[typography.heading, styles.closeTxt]}>×</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, shadows.card]}>
          <Text style={[typography.subheading, styles.cardTitle]}>Daily pages goal</Text>
          <Text style={[typography.bodySmall, styles.help]}>
            Choose a daily target that feels sustainable.
          </Text>
          <Input
            label="Pages per day (1–604)"
            value={goal}
            onChangeText={setGoal}
            keyboardType="number-pad"
            placeholder="1"
          />
          <Button title="Save" onPress={save} disabled={!valid} />
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
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  help: {
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});

