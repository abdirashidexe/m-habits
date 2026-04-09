import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionTypes, useApp } from '../../context/AppContext';
import { useNurTheme } from '../../hooks/useNurTheme';
import { getColors } from '../../theme';

export default function AppColorsModal() {
  const { t } = useTranslation();
  const OPTIONS = [
    { id: 'pink', label: t('appColors.pink') },
    { id: 'main', label: t('appColors.main'), center: true },
    { id: 'blue', label: t('appColors.blue') },
  ];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const { colors, typography, spacing, radii } = useNurTheme();
  const styles = makeStyles({ colors, spacing, radii });
  const mode = state.userProfile.darkMode ? 'dark' : 'light';
  const selected = state.userProfile.colorTheme || 'main';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={8}>
          <Text style={[typography.body, styles.closeTxt]}>✕</Text>
        </Pressable>
        <Text style={[typography.subheading, styles.title]}>{t('appColors.title')}</Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.cardsRow}>
        {OPTIONS.map(({ id, label, center }) => {
          const preview = getColors(mode, id);
          const isOn = selected === id;
          return (
            <Pressable
              key={id}
              onPress={() => dispatch({ type: ActionTypes.SET_COLOR_THEME, payload: id })}
              style={[
                styles.card,
                center ? styles.cardCenter : styles.cardSide,
                isOn && styles.cardSelected,
                { borderColor: isOn ? colors.primary : colors.divider },
              ]}
            >
              <View style={styles.swatchRow}>
                <View style={[styles.swatch, { backgroundColor: preview.primary }]} />
                <View style={[styles.swatch, { backgroundColor: preview.primaryLight }]} />
              </View>
              <Text style={[typography.subheading, styles.cardTitle, { color: colors.textPrimary }]}>
                {label}
              </Text>
              {id === 'main' ? (
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {t('appColors.default')}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles({ colors, spacing, radii }) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
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
    },
    cardsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    card: {
      flex: 1,
      borderRadius: radii.lg,
      borderWidth: 2,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardSide: {
      minHeight: 132,
      paddingVertical: spacing.md,
    },
    cardCenter: {
      minHeight: 156,
      paddingVertical: spacing.md,
      transform: [{ scale: 1.02 }],
    },
    cardSelected: {
      backgroundColor: colors.surfaceElevated,
    },
    swatchRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: spacing.sm,
    },
    swatch: {
      width: 28,
      height: 28,
      borderRadius: radii.sm,
    },
    cardTitle: {
      textAlign: 'center',
    },
  });
}
