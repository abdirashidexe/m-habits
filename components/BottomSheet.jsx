import React, { useEffect } from 'react';
import { Modal, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, radii, shadows, spacing } from '../theme';

const { height: SCREEN_H } = Dimensions.get('window');

/**
 * @param {{
 *   visible: boolean,
 *   onClose: () => void,
 *   children: React.ReactNode,
 * }} props
 */
export function BottomSheet({ visible, onClose, children }) {
  const translateY = useSharedValue(SCREEN_H);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 28, stiffness: 280 });
    } else {
      translateY.value = SCREEN_H;
    }
  }, [visible, translateY]);

  const finishClose = () => {
    onClose();
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 600) {
        translateY.value = withSpring(SCREEN_H, { damping: 24, stiffness: 260 }, () => {
          runOnJS(finishClose)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 28, stiffness: 280 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.sheet, shadows.modal, sheetStyle]}>
            <View style={styles.handle} />
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    maxHeight: SCREEN_H * 0.88,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.divider,
    marginBottom: spacing.md,
  },
});
