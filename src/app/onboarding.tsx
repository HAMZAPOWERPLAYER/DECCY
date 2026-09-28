import { Redirect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated';

import { CompanionForm } from '@/components/companion-form';
import { QuietPressable } from '@/components/controls';
import { Screen, useScreenPadding } from '@/components/screen';
import { Label, Serif, Tiny } from '@/components/text';
import { useCompanion } from '@/state/companion';
import { colors, spacing } from '@/theme';

type Step = {
  line: string;
  note: string;
};

const STEPS: Step[] = [
  {
    line: 'A small companion is about to live on your phone.',
    note: 'not a pet. not a game. only something present.',
  },
  {
    line: 'It lives while you come back and stay a while.',
    note: 'staying counts. passing through does not.',
  },
  {
    line: 'Left alone, it fades — and it does not come back.',
    note: 'there is no undo and no restart. only beginning again from the beginning.',
  },
  {
    line: 'This is about presence, not performance.',
    note: 'it will not keep score of you.',
  },
];

const TOTAL = STEPS.length + 1;
const { width } = Dimensions.get('window');
const FORM_SIZE = Math.min(width * 0.52, 210);

export default function OnboardingScreen() {
  const { state, status, plant } = useCompanion();
  const router = useRouter();
  const padding = useScreenPadding();
  const [step, setStep] = useState(0);

  const begin = useCallback(() => {
    plant();
    router.replace('/');
  }, [plant, router]);

  const advance = useCallback(() => {
    if (step < TOTAL - 1) setStep(step + 1);
    else begin();
  }, [begin, step]);

  if (status === 'ready' && state.onboarded) return <Redirect href="/" />;

  const isLast = step === TOTAL - 1;

  return (
    <Screen>
      <Pressable
        style={styles.touch}
        onPress={advance}
        accessibilityRole="button"
        accessibilityLabel={isLast ? 'Begin' : 'Continue'}
      >
        <View style={[styles.body, { paddingTop: padding.paddingTop, paddingBottom: padding.paddingBottom }]}>
          <View style={styles.dots}>
            {Array.from({ length: TOTAL }, (_, index) => (
              <View key={index} style={[styles.dot, index === step && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.center}>
            {isLast ? (
              <Animated.View
                key="glow"
                entering={FadeIn.duration(2400).easing(Easing.out(Easing.quad))}
                style={styles.form}
              >
                <CompanionForm stage={0} size={FORM_SIZE} ambient={0.7} />
              </Animated.View>
            ) : (
              <Animated.View
                key={`text-${step}`}
                entering={FadeIn.duration(1100)}
                exiting={FadeOut.duration(400)}
                style={styles.copy}
              >
                <Serif style={styles.line} accessibilityRole="header">
                  {STEPS[step].line}
                </Serif>
                <Tiny style={styles.note}>{STEPS[step].note}</Tiny>
              </Animated.View>
            )}
          </View>

          <View style={styles.footer}>
            {isLast ? (
              <QuietPressable
                onPress={begin}
                accessibilityRole="button"
                accessibilityLabel="Begin"
                style={styles.begin}
              >
                <Label style={styles.beginLabel} tone="gold">
                  BEGIN
                </Label>
              </QuietPressable>
            ) : (
              <Label>CONTINUE</Label>
            )}
          </View>
        </View>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  touch: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 10,
    paddingTop: spacing.lg,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.inkGhost,
  },
  dotActive: {
    backgroundColor: colors.inkFaint,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.lg,
    maxWidth: 420,
  },
  line: {
    textAlign: 'center',
    fontSize: 27,
    lineHeight: 42,
    letterSpacing: -0.2,
  },
  note: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.4,
    maxWidth: 320,
  },
  form: {
    opacity: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    minHeight: 56,
    justifyContent: 'flex-end',
  },
  begin: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  beginLabel: {
    fontSize: 13,
    letterSpacing: 4,
  },
});
