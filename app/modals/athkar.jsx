import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useApp, ActionTypes } from '../../context/AppContext';
import { ProgressBar } from '../../components/ProgressBar';
import { Button } from '../../components/Button';
import { getAthkarForSession } from '../../constants/athkar';
import { colors, typography, spacing, radii } from '../../theme';
import { toLocalDateString } from '../../utils/dates';

export default function AthkarModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type: typeParam } = useLocalSearchParams();
  const raw = typeof typeParam === 'string' ? typeParam : typeParam?.[0];
  const sessionType =
    raw === 'morning' || raw === 'evening' || raw === 'night' ? raw : 'morning';

  const { dispatch } = useApp();
  const items = useMemo(() => getAthkarForSession(sessionType), [sessionType]);

  const [cardIndex, setCardIndex] = useState(0);
  const [remainingTaps, setRemainingTaps] = useState(items[0]?.count ?? 1);

  const totalCards = items.length;
  const current = items[cardIndex];
  const progress =
    totalCards > 0 && current
      ? (cardIndex + (current.count - remainingTaps) / current.count) / totalCards
      : 0;

  const scale = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const close = useCallback(() => router.back(), [router]);

  const requestClose = () => {
    const started = cardIndex > 0 || (current && remainingTaps < current.count);
    if (started) {
      Alert.alert('Leave session?', 'Your progress for this session will stay until you complete it.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: close },
      ]);
    } else {
      close();
    }
  };

  const advanceCard = () => {
    if (cardIndex + 1 >= totalCards) {
      scale.value = withSequence(
        withTiming(1.06, { duration: 160 }),
        withTiming(1, { duration: 220 })
      );
      const todayStr = toLocalDateString(new Date());
      dispatch({
        type: ActionTypes.COMPLETE_ATHKAR_SESSION,
        payload: { type: sessionType, date: todayStr },
      });
      setTimeout(() => {
        close();
      }, 480);
      return;
    }
    const next = items[cardIndex + 1];
    setCardIndex(cardIndex + 1);
    setRemainingTaps(next.count);
  };

  const onCardTap = () => {
    if (!current) return;
    if (current.count <= 1) {
      advanceCard();
      return;
    }
    if (remainingTaps <= 1) {
      advanceCard();
    } else {
      setRemainingTaps(remainingTaps - 1);
    }
  };

  const title =
    sessionType === 'morning'
      ? 'Morning Athkar'
      : sessionType === 'evening'
        ? 'Evening Athkar'
        : 'Night Athkar';

  if (!current) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Pressable onPress={close} style={styles.closeBtn}>
          <Text style={[typography.heading, styles.closeTxt]}>×</Text>
        </Pressable>
        <Text style={[typography.body, styles.err]}>Nothing to display.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topBar}>
        <Pressable onPress={requestClose} style={styles.backBtn} accessibilityLabel="Go back">
          <Text style={[typography.subheading, styles.backTxt]}>‹</Text>
        </Pressable>
        <Text style={[typography.heading, styles.title]}>{title}</Text>
        <Pressable onPress={requestClose} style={styles.closeBtn} accessibilityLabel="Close">
          <Text style={[typography.heading, styles.closeTxt]}>×</Text>
        </Pressable>
      </View>

      <Text style={[typography.caption, styles.progLbl]}>
        {cardIndex + 1} / {totalCards}
      </Text>
      <ProgressBar progress={progress} style={styles.progBar} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.card, popStyle]}>
          <Pressable onPress={onCardTap} style={styles.cardInner}>
            <Text style={[typography.displayMedium, styles.ar]}>{current.arabic}</Text>
            <Text style={[typography.body, styles.trans]}>{current.transliteration}</Text>
            <Text style={[typography.body, styles.en]}>{current.translation}</Text>
            {current.count > 1 ? (
              <Text style={[typography.subheading, styles.repeat]}>
                {remainingTaps} repetition{remainingTaps === 1 ? '' : 's'} remaining — tap the card
              </Text>
            ) : null}
          </Pressable>
        </Animated.View>

        <Button title="Done" variant="secondary" onPress={onCardTap} style={styles.doneBtn} />
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backTxt: {
    color: colors.primary,
    fontSize: 28,
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
  progLbl: {
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  progBar: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.md,
  },
  cardInner: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  ar: {
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 40,
    writingDirection: 'rtl',
  },
  trans: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  en: {
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  repeat: {
    color: colors.accent,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  doneBtn: {
    marginTop: spacing.sm,
  },
  err: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
