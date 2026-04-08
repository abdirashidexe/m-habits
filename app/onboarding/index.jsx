import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { useApp, ActionTypes, runPostOnboardingNotificationSetup } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radii } from '../../theme';
import { nowIso } from '../../utils/now';

function MoonIllustration() {
  return (
    <View style={styles.moonWrap}>
      <View style={styles.moonCircle} />
      <View style={styles.moonMask} />
      <View style={styles.star} />
      <View style={[styles.star, styles.star2]} />
    </View>
  );
}

function parseGoal(raw) {
  const n = parseInt(String(raw).replace(/[^\d]/g, ''), 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 604) return null;
  return n;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goalInput, setGoalInput] = useState('1');

  const goalNum = parseGoal(goalInput);
  const goalValid = goalNum !== null;

  const finish = async () => {
    const trimmed = name.trim();
    if (!trimmed || !goalValid || goalNum === null) return;
    dispatch({ type: ActionTypes.SET_USER_NAME, payload: trimmed });
    dispatch({ type: ActionTypes.SET_QURAN_DAILY_GOAL, payload: goalNum });
    dispatch({ type: ActionTypes.SET_ONBOARDED, payload: { onboarded: true, nowIso: nowIso() } });
    await runPostOnboardingNotificationSetup();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {step === 0 ? (
        <View style={styles.slide}>
          <Text style={[typography.displayLarge, styles.title]}>Nur</Text>
          <Text style={[typography.body, styles.tagline]}>
            Your daily companion for a life of barakah
          </Text>
          <MoonIllustration />
          <Button title="Continue" onPress={() => setStep(1)} style={styles.btn} />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.slide}>
          <Text style={[typography.displayMedium, styles.heading]}>Track what matters</Text>
          <Text style={[typography.body, styles.body]}>
            Nur helps you stay close to the Quran with a daily reading goal and build habits you
            shape for your own path.
          </Text>
          <Button title="Continue" onPress={() => setStep(2)} style={styles.btn} />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.slide}>
          <Text style={[typography.heading, styles.q]}>What should we call you?</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            style={[typography.body, styles.input]}
            maxLength={40}
            autoFocus
          />
          <Button
            title="Continue"
            onPress={() => setStep(3)}
            disabled={!name.trim()}
            style={styles.btn}
          />
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.slide}>
          <Text style={[typography.heading, styles.q]}>
            How many pages of Quran do you want to read daily?
          </Text>
          <TextInput
            value={goalInput}
            onChangeText={setGoalInput}
            placeholder="1"
            placeholderTextColor={colors.textMuted}
            style={[typography.body, styles.input]}
            keyboardType="number-pad"
            maxLength={3}
            autoFocus
          />
          <Text style={[typography.caption, styles.hint]}>Between 1 and 604 pages per day.</Text>
          <Button title="Get Started" onPress={finish} disabled={!goalValid} style={styles.btn} />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  moonWrap: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    marginVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moonCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  moonMask: {
    position: 'absolute',
    width: 100,
    height: 120,
    backgroundColor: colors.background,
    borderRadius: 60,
    left: 58,
    top: 20,
  },
  star: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: colors.accent,
    borderRadius: 2,
    top: 24,
    right: 20,
    transform: [{ rotate: '45deg' }],
  },
  star2: {
    width: 6,
    height: 6,
    top: 48,
    right: 40,
  },
  heading: {
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  q: {
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  btn: {
    marginTop: spacing.md,
  },
});
