import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp, ActionTypes } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { searchSurahs, SURAH_NAMES_EN } from '../../constants/surahs';
import { colors, typography, spacing, radii } from '../../theme';
import { toLocalDateString } from '../../utils/dates';

export default function LogQuranModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const todayStr = toLocalDateString(new Date());

  const existing = state.quranLogs.find((q) => q.date === todayStr);

  const [pages, setPages] = useState(existing ? String(existing.pagesRead) : '1');
  const [surahFromQ, setSurahFromQ] = useState(existing?.surahFrom || '');
  const [ayahFrom, setAyahFrom] = useState(existing ? String(existing.ayahFrom) : '1');
  const [surahToQ, setSurahToQ] = useState(existing?.surahTo || '');
  const [ayahTo, setAyahTo] = useState(existing ? String(existing.ayahTo) : '1');
  const [notes, setNotes] = useState(existing?.notes || '');

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const fromSuggestions = useMemo(() => searchSurahs(surahFromQ), [surahFromQ]);
  const toSuggestions = useMemo(() => searchSurahs(surahToQ), [surahToQ]);

  const close = () => router.back();

  const pickFrom = (en) => {
    setSurahFromQ(en);
    setFromOpen(false);
  };

  const pickTo = (en) => {
    setSurahToQ(en);
    setToOpen(false);
  };

  const save = () => {
    const p = Math.max(1, parseInt(pages, 10) || 1);
    const af = Math.max(1, parseInt(ayahFrom, 10) || 1);
    const at = Math.max(1, parseInt(ayahTo, 10) || 1);
    const sf = surahFromQ.trim() || SURAH_NAMES_EN[0];
    const st = surahToQ.trim() || sf;

    dispatch({
      type: ActionTypes.UPSERT_QURAN_LOG,
      payload: {
        date: todayStr,
        pagesRead: p,
        surahFrom: sf,
        ayahFrom: af,
        surahTo: st,
        ayahTo: at,
        notes: notes.slice(0, 200),
      },
    });
    close();
  };

  const pagesNum = Math.max(1, parseInt(pages, 10) || 1);
  const valid = pagesNum >= 1 && surahFromQ.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <View style={styles.spacer} />
        <Text style={[typography.heading, styles.title]}>Log Quran</Text>
        <Pressable onPress={close} style={styles.closeBtn} accessibilityLabel="Close">
          <Text style={[typography.heading, styles.closeTxt]}>×</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Input
          label="Pages read today"
          value={pages}
          onChangeText={(t) => setPages(t.replace(/[^\d]/g, ''))}
          keyboardType="number-pad"
        />

        <Text style={[typography.caption, styles.lbl]}>Starting surah</Text>
        <Input
          value={surahFromQ}
          onChangeText={(t) => {
            setSurahFromQ(t);
            setFromOpen(true);
          }}
          placeholder="Search English or Arabic name"
          onFocus={() => setFromOpen(true)}
        />
        {fromOpen && fromSuggestions.length > 0 ? (
          <View style={styles.suggest}>
            {fromSuggestions.map((s) => (
              <Pressable key={s.index} style={styles.sugRow} onPress={() => pickFrom(s.en)}>
                <Text style={[typography.body, styles.sugEn]}>{s.en}</Text>
                <Text style={[typography.caption, styles.sugAr]}>{s.ar}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Input
          label="Starting ayah"
          value={ayahFrom}
          onChangeText={(t) => setAyahFrom(t.replace(/[^\d]/g, ''))}
          keyboardType="number-pad"
        />

        <Text style={[typography.caption, styles.lbl]}>Ending surah</Text>
        <Input
          value={surahToQ}
          onChangeText={(t) => {
            setSurahToQ(t);
            setToOpen(true);
          }}
          placeholder="Search English or Arabic name"
          onFocus={() => setToOpen(true)}
        />
        {toOpen && toSuggestions.length > 0 ? (
          <View style={styles.suggest}>
            {toSuggestions.map((s) => (
              <Pressable key={s.index} style={styles.sugRow} onPress={() => pickTo(s.en)}>
                <Text style={[typography.body, styles.sugEn]}>{s.en}</Text>
                <Text style={[typography.caption, styles.sugAr]}>{s.ar}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Input
          label="Ending ayah"
          value={ayahTo}
          onChangeText={(t) => setAyahTo(t.replace(/[^\d]/g, ''))}
          keyboardType="number-pad"
        />

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={(t) => setNotes(t.slice(0, 200))}
          multiline
          maxLength={200}
        />
        <Text style={[typography.caption, styles.count]}>{notes.length}/200</Text>

        <Button title="Save" onPress={save} disabled={!valid} />
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
  form: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  lbl: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  suggest: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.sm,
    maxHeight: 200,
  },
  sugRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sugEn: {
    color: colors.textPrimary,
  },
  sugAr: {
    color: colors.textSecondary,
    marginTop: 2,
    writingDirection: 'rtl',
  },
  count: {
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
});
