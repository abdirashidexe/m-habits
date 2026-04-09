import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '../../constants/languages';
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

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');

  const finish = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: ActionTypes.SET_LANGUAGE, payload: language });
    dispatch({ type: ActionTypes.SET_USER_NAME, payload: trimmed });
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
          <Text style={[typography.displayLarge, styles.title]}>{t('onboarding.title')}</Text>
          <Text style={[typography.body, styles.tagline]}>{t('onboarding.tagline')}</Text>
          <MoonIllustration />
          <Button title={t('onboarding.continue')} onPress={() => setStep(1)} style={styles.btn} />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.slide}>
          <Text style={[typography.heading, styles.q]}>{t('onboarding.chooseLanguage')}</Text>
          <Text style={[typography.bodySmall, styles.hint]}>{t('onboarding.languageHint')}</Text>
          <View style={styles.langList}>
            {LANGUAGES.map(({ id, native }) => (
              <Pressable
                key={id}
                onPress={() => {
                  setLanguage(id);
                  dispatch({ type: ActionTypes.SET_LANGUAGE, payload: id });
                }}
                style={[
                  styles.langRow,
                  language === id ? styles.langRowOn : styles.langRowOff,
                ]}
              >
                <Text
                  style={[
                    typography.body,
                    language === id ? styles.langTxtOn : styles.langTxtOff,
                  ]}
                >
                  {native}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button title={t('onboarding.continue')} onPress={() => setStep(2)} style={styles.btn} />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.slide}>
          <Text style={[typography.displayMedium, styles.heading]}>{t('onboarding.trackTitle')}</Text>
          <Text style={[typography.body, styles.body]}>{t('onboarding.trackBody')}</Text>
          <Button title={t('onboarding.continue')} onPress={() => setStep(3)} style={styles.btn} />
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.slide}>
          <Text style={[typography.heading, styles.q]}>{t('onboarding.nameQuestion')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('onboarding.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={[typography.body, styles.input]}
            maxLength={40}
            autoFocus
          />
          <Button
            title={t('onboarding.getStarted')}
            onPress={finish}
            disabled={!name.trim()}
            style={styles.btn}
          />
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
  langList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  langRow: {
    borderRadius: radii.lg,
    borderWidth: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  langRowOff: {
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  langRowOn: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  langTxtOff: {
    color: colors.textPrimary,
  },
  langTxtOn: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
