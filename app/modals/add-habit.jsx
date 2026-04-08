import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp, ActionTypes } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { DayPicker } from '../../components/DayPicker';
import { colors, typography, spacing, radii } from '../../theme';
import { createUuid } from '../../utils/uuid';
import { scheduleHabitReminder, cancelHabitReminder } from '../../utils/notifications';
import { nowIso } from '../../utils/now';

export default function AddHabitModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const editId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : undefined;
  const { state, dispatch } = useApp();

  const existing = useMemo(
    () => (editId ? state.habits.find((h) => h.id === editId) : null),
    [editId, state.habits]
  );

  const [name, setName] = useState('');
  const [freqDaily, setFreqDaily] = useState(true);
  const [specificDays, setSpecificDays] = useState([]);
  const [reminderOn, setReminderOn] = useState(false);
  const [hour, setHour] = useState('8');
  const [minute, setMinute] = useState('0');

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setFreqDaily(existing.frequency === 'daily');
      setSpecificDays(existing.specificDays || []);
      setReminderOn(existing.reminderEnabled);
      if (existing.reminderTime) {
        const [h, m] = existing.reminderTime.split(':');
        setHour(h || '8');
        setMinute(m || '0');
      }
    }
  }, [existing]);

  const customCount = state.habits.filter((h) => h.type === 'custom').length;
  const premium = state.userProfile.isPremium;

  const close = () => router.back();

  const reminderTimeStr = () => {
    const h = Math.min(23, Math.max(0, parseInt(hour, 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(minute, 10) || 0));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!freqDaily && specificDays.length === 0) return;

    if (!existing && !premium && customCount >= 3) {
      Alert.alert(
        'Nur Premium',
        'Free accounts can track up to 3 custom habits. Unlock Premium for unlimited habits.',
        [{ text: 'OK' }]
      );
      return;
    }

    const reminderTime = reminderOn ? reminderTimeStr() : null;
    const payload = {
      id: existing?.id || createUuid(),
      name: trimmed.slice(0, 40),
      type: 'custom',
      frequency: freqDaily ? 'daily' : 'specific_days',
      specificDays: freqDaily ? [] : [...specificDays].sort((a, b) => a - b),
      reminderEnabled: reminderOn,
      reminderTime,
      createdAt: existing?.createdAt || nowIso(),
      isPremium: false,
    };

    if (existing) {
      dispatch({ type: ActionTypes.UPDATE_HABIT, payload });
    } else {
      dispatch({ type: ActionTypes.ADD_HABIT, payload });
    }

    if (reminderOn && state.masterNotificationsEnabled) {
      await scheduleHabitReminder(payload);
    } else {
      await cancelHabitReminder(payload.id);
    }

    close();
  };

  const invalid =
    !name.trim() || (!freqDaily && specificDays.length === 0);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        <Text style={[typography.heading, styles.title]}>
          {existing ? 'Edit habit' : 'New habit'}
        </Text>
        <Pressable onPress={close} style={styles.closeBtn} accessibilityLabel="Close">
          <Text style={[typography.heading, styles.closeTxt]}>×</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Input
          label="Habit name"
          value={name}
          onChangeText={(t) => setName(t.slice(0, 40))}
          placeholder="e.g. Dhuhr in congregation"
          maxLength={40}
        />
        <Text style={[typography.caption, styles.count]}>{name.length}/40</Text>

        <Text style={[typography.subheading, styles.lbl]}>Frequency</Text>
        <View style={styles.freqRow}>
          <Pressable
            onPress={() => setFreqDaily(true)}
            style={[styles.chip, freqDaily && styles.chipOn]}
          >
            <Text style={[typography.body, freqDaily ? styles.chipTxtOn : styles.chipTxt]}>
              Every Day
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFreqDaily(false)}
            style={[styles.chip, !freqDaily && styles.chipOn]}
          >
            <Text style={[typography.body, !freqDaily ? styles.chipTxtOn : styles.chipTxt]}>
              Specific Days
            </Text>
          </Pressable>
        </View>

        {!freqDaily ? (
          <View style={styles.dpWrap}>
            <DayPicker value={specificDays} onChange={setSpecificDays} />
          </View>
        ) : null}

        <View style={styles.rowBetween}>
          <Text style={[typography.body, styles.lbl]}>Reminder</Text>
          <Switch
            value={reminderOn}
            onValueChange={setReminderOn}
            trackColor={{ false: colors.divider, true: colors.primaryLight }}
            thumbColor={colors.background}
          />
        </View>

        {reminderOn ? (
          <View style={styles.timeRow}>
            <Text style={[typography.caption, styles.timeLbl]}>Hour (0–23)</Text>
            <Input
              value={hour}
              onChangeText={(t) => setHour(t.replace(/[^\d]/g, '').slice(0, 2))}
              keyboardType="number-pad"
              style={styles.timeInput}
            />
            <Text style={[typography.caption, styles.timeLbl]}>Minute (0–59)</Text>
            <Input
              value={minute}
              onChangeText={(t) => setMinute(t.replace(/[^\d]/g, '').slice(0, 2))}
              keyboardType="number-pad"
              style={styles.timeInput}
            />
          </View>
        ) : null}

        <Button title="Save" onPress={save} disabled={invalid} style={styles.save} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  topSpacer: {
    width: 40,
  },
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
  form: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  count: {
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  lbl: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  freqRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTxt: {
    color: colors.textSecondary,
  },
  chipTxtOn: {
    color: colors.background,
    fontWeight: '600',
  },
  dpWrap: {
    marginBottom: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timeRow: {
    marginBottom: spacing.lg,
  },
  timeLbl: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  timeInput: {
    marginBottom: spacing.sm,
  },
  save: {
    marginTop: spacing.md,
  },
});
