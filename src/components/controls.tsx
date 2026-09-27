import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Body, Tiny } from '@/components/text';
import { colors, spacing } from '@/theme';

type QuietPressableProps = PressableProps & {
  children: ReactNode;
};

/** Everything is a link, not a button — pressed state is just a dimming. */
export function QuietPressable({ children, style, ...rest }: QuietPressableProps) {
  const dim = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({ opacity: dim.value }));

  return (
    <Pressable
      {...rest}
      onPressIn={(event) => {
        dim.value = withTiming(0.45, { duration: 120, easing: Easing.out(Easing.quad) });
        rest.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        dim.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) });
        rest.onPressOut?.(event);
      }}
      style={style}
    >
      <Animated.View style={animated}>{children}</Animated.View>
    </Pressable>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function ListRow({
  title,
  note,
  onPress,
  first = false,
  accessibilityLabel,
}: {
  title: string;
  note?: string;
  onPress?: () => void;
  first?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <>
      {first ? null : <Divider />}
      <QuietPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        style={styles.row}
      >
        <View style={styles.rowText}>
          <Body style={styles.rowTitle} tone="ink">
            {title}
          </Body>
          {note ? <Tiny style={styles.rowNote}>{note}</Tiny> : null}
        </View>
      </QuietPressable>
    </>
  );
}

export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, value]);

  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(240, 237, 230, 0.08)', 'rgba(232, 200, 136, 0.30)'],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(240, 237, 230, 0.16)', 'rgba(232, 200, 136, 0.55)'],
    ),
  }));

  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: 1 + progress.value * (44 - 22 - 2) }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(240, 237, 230, 0.55)', colors.gold],
    ),
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      hitSlop={12}
      style={styles.toggleRow}
    >
      <Body style={styles.toggleLabel} tone="ink">
        {label}
      </Body>
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginLeft: spacing.lg,
  },
  row: {
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
  },
  rowText: {
    flexDirection: 'column',
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  rowNote: {
    fontSize: 12,
    lineHeight: 17,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  toggleLabel: {
    flex: 1,
    color: colors.ink,
  },
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth + 0.5,
    justifyContent: 'center',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
