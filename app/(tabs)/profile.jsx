import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { format, parseISO, isValid } from 'date-fns';

import { useApp, ActionTypes } from '../../context/AppContext';
import { PremiumBadge } from '../../components/PremiumBadge';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { overallLongestStreakRecord } from '../../utils/streak';
import * as storage from '../../utils/storage';
import { cancelAllLocalNotifications } from '../../utils/notifications';

const PREMIUM_BENEFITS = [
  'Unlimited custom habits',
  'Full stats history (30-day & all-time views)',
  'Streak protection (coming soon)',
  'Custom themes (coming soon)',
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.userProfile.name);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  const version = Constants.expoConfig?.version || '1.0.0';
  const premium = state.userProfile.isPremium;

  const joined = state.userProfile.joinedAt;
  const joinedLabel =
    joined && isValid(parseISO(joined))
      ? format(parseISO(joined), 'MMMM d, yyyy')
      : '—';

  const overallLongest = overallLongestStreakRecord(
    state.habits.filter((h) => h.type === 'custom'),
    state.habitLogs,
    state.quranLogs.map((q) => ({ ...q, pagesRead: q.completed ? 1 : 0 }))
  );

  const initial = (state.userProfile.name || '?').trim().charAt(0).toUpperCase();

  const onVersionPress = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 900);
    if (tapCount.current >= 7) {
      tapCount.current = 0;
      router.push('/modals/dev-tools');
    }
  };

  const saveName = () => {
    dispatch({ type: ActionTypes.SET_USER_NAME, payload: nameDraft.trim() });
    setEditingName(false);
  };

  const unlockPremium = () => {
    Alert.alert(
      'Coming soon',
      'Payment integration will be added in the next update.',
      [{ text: 'OK' }]
    );
  };

  const reminderDefaults = () => {
    Alert.alert('Reminder defaults', 'Coming soon.', [{ text: 'OK' }]);
  };

  const privacy = () => {
    Alert.alert('Privacy policy', 'A dedicated privacy policy link will be added in a future update.', [
      { text: 'OK' },
    ]);
  };

  const resetData = () => {
    Alert.alert(
      'Reset all data?',
      'This removes habits, logs, and profile from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Are you absolutely sure?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Erase everything',
                style: 'destructive',
                onPress: async () => {
                  await cancelAllLocalNotifications();
                  await storage.clearAllNurKeys();
                  dispatch({ type: ActionTypes.RESET_ALL });
                  router.replace('/onboarding');
                },
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[typography.displayMedium, styles.title]}>Profile</Text>

        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={[typography.displayMedium, styles.avatarTxt]}>{initial}</Text>
          </View>
          {editingName ? (
            <View style={styles.nameEdit}>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                style={[typography.heading, styles.nameInput]}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                maxLength={40}
              />
              <Pressable onPress={saveName} style={styles.saveName}>
                <Text style={[typography.caption, styles.saveNameTxt]}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => { setNameDraft(state.userProfile.name); setEditingName(true); }}>
              <Text style={[typography.heading, styles.name]}>{state.userProfile.name || 'Your name'}</Text>
              <Text style={[typography.caption, styles.tapHint]}>Tap to edit</Text>
            </Pressable>
          )}
          <Text style={[typography.bodySmall, styles.meta]}>Member since {joinedLabel}</Text>
          <Text style={[typography.bodySmall, styles.meta]}>
            Longest overall streak: {overallLongest} day{overallLongest === 1 ? '' : 's'}
          </Text>
        </View>

        {!premium ? (
          <View style={[styles.premiumCard, shadows.card]}>
            <PremiumBadge />
            <Text style={[typography.subheading, styles.premTitle]}>Nur Premium</Text>
            {PREMIUM_BENEFITS.map((b) => (
              <Text key={b} style={[typography.bodySmall, styles.benefit]}>
                • {b}
              </Text>
            ))}
            <Button title="Unlock Nur Premium" onPress={unlockPremium} style={styles.premBtn} />
          </View>
        ) : (
          <View style={[styles.premiumOn, shadows.card]}>
            <Text style={[typography.subheading, styles.premOnTxt]}>✦ Nur Premium</Text>
            {state.userProfile.premiumSince && isValid(parseISO(state.userProfile.premiumSince)) ? (
              <Text style={[typography.caption, styles.premSince]}>
                Since {format(parseISO(state.userProfile.premiumSince), 'MMMM d, yyyy')}
              </Text>
            ) : null}
          </View>
        )}

        <Text style={[typography.heading, styles.section]}>Settings</Text>
        <View style={[styles.row, styles.cardRow]}>
          <Text style={[typography.body, styles.rowLbl]}>Notifications</Text>
          <Switch
            value={state.masterNotificationsEnabled}
            onValueChange={(v) => dispatch({ type: ActionTypes.SET_MASTER_NOTIFICATIONS, payload: v })}
            trackColor={{ false: colors.divider, true: colors.primaryLight }}
            thumbColor={colors.background}
          />
        </View>
        <Pressable style={[styles.row, styles.cardRow]} onPress={reminderDefaults}>
          <Text style={[typography.body, styles.rowLbl]}>Reminder defaults</Text>
          <Text style={[typography.caption, styles.chev]}>›</Text>
        </Pressable>
        <Pressable style={[styles.row, styles.cardRow]} onPress={resetData}>
          <Text style={[typography.body, styles.danger]}>Reset all data</Text>
        </Pressable>

        <Text style={[typography.heading, styles.section]}>About</Text>
        <View style={[styles.about, shadows.card]}>
          <Pressable onPress={onVersionPress}>
            <Text style={[typography.caption, styles.ver]}>Version {version}</Text>
          </Pressable>
          <Text style={[typography.bodySmall, styles.aboutTxt]}>
            Nur is a calm companion for Quran and daily habits — designed to help you show up
            with sincerity, offline and in your own rhythm.
          </Text>
          <Pressable onPress={privacy}>
            <Text style={[typography.caption, styles.link]}>Privacy policy (link coming soon)</Text>
          </Pressable>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

    </View>
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
    marginBottom: spacing.md,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarTxt: {
    color: colors.primary,
  },
  name: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tapHint: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  nameEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameInput: {
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 200,
    backgroundColor: colors.surface,
  },
  saveName: {
    padding: spacing.sm,
  },
  saveNameTxt: {
    color: colors.primary,
    fontWeight: '700',
  },
  meta: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  premiumCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.premiumGold,
    marginBottom: spacing.lg,
  },
  premTitle: {
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  benefit: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  premBtn: {
    marginTop: spacing.md,
  },
  premiumOn: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.premiumGold,
    marginBottom: spacing.lg,
  },
  premOnTxt: {
    color: colors.premiumGold,
  },
  premSince: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  cardRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.sm,
  },
  rowLbl: {
    color: colors.textPrimary,
  },
  chev: {
    color: colors.textMuted,
    fontSize: 22,
  },
  danger: {
    color: colors.danger,
    fontWeight: '600',
  },
  about: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  ver: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  aboutTxt: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
