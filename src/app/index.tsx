import * as Haptics from 'expo-haptics';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { CompanionForm } from '@/components/companion-form';
import { QuietPressable } from '@/components/controls';
import { Screen, useScreenPadding } from '@/components/screen';
import { Label, Tiny } from '@/components/text';
import { useAmbientAudio } from '@/hooks/use-ambient-audio';
import { usePresence } from '@/hooks/use-presence';
import { useCompanion } from '@/state/companion';
import { DEATH_REVEAL_MS } from '@/components/transition-spec';
import { colors, spacing } from '@/theme';

const { width } = Dimensions.get('window');
const FORM_SIZE = Math.min(width * 0.56, 240);

function PassingReveal() {
  const opacity = useSharedValue(1);
  const [showLine, setShowLine] = useState(false);
  const formStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    opacity.value = withDelay(420, withTiming(0.08, { duration: 1800 }));
    const timer = setTimeout(() => setShowLine(true), 1900);
    return () => clearTimeout(timer);
  }, [opacity]);

  return (
    <Screen>
      <View style={styles.passingBody}>
        <Animated.View style={formStyle}>
          <CompanionForm stage={5} size={FORM_SIZE} />
        </Animated.View>
        <View style={styles.passingLine}>
          {showLine ? (
            <Animated.View entering={FadeIn.duration(1500)}>
              <Label style={styles.passingText}>passed quietly</Label>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

export default function HomeScreen() {
  const { state, status, decay } = useCompanion();
  const router = useRouter();
  const padding = useScreenPadding();
  const [focused, setFocused] = useState(false);
  const [showWhisper, setShowWhisper] = useState(false);
  const [passingReveal, setPassingReveal] = useState(false);
  const passingStarted = useRef(false);

  const ready = status === 'ready';
  const needsOnboarding = ready && !state.onboarded;
  const isDead = ready && state.plantedAt !== null && decay.dead;
  const interactive = ready && !needsOnboarding && !isDead;

  const stayed = usePresence(focused && interactive);
  useAmbientAudio(focused && interactive);

  useEffect(() => {
    if (!decay.dead || state.passedAt !== null || passingStarted.current) return;
    passingStarted.current = true;
    setPassingReveal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    const timer = setTimeout(() => router.replace('/certificate'), DEATH_REVEAL_MS);
    return () => clearTimeout(timer);
  }, [decay.dead]);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    if (!stayed) {
      setShowWhisper(false);
      return;
    }
    setShowWhisper(true);
    const timer = setTimeout(() => setShowWhisper(false), 4400);
    return () => clearTimeout(timer);
  }, [stayed]);

  if (!ready) return <Screen />;
  if (needsOnboarding) return <Redirect href="/onboarding" />;
  if (passingReveal || (isDead && state.passedAt === null)) return <PassingReveal />;
  if (isDead) return <Redirect href="/certificate" />;

  return (
    <Screen>
      <View
        style={[
          styles.body,
          { paddingTop: padding.paddingTop, paddingBottom: padding.paddingBottom },
        ]}
      >
        <View style={styles.stage}>
          <CompanionForm stage={decay.stage} size={FORM_SIZE} />

          <View style={styles.whisperSlot}>
            {showWhisper ? (
              <Animated.View entering={FadeIn.duration(1400)} exiting={FadeOut.duration(1800)}>
                <Label style={styles.whisper}>you stayed.</Label>
              </Animated.View>
            ) : null}
          </View>
        </View>

        <View style={styles.footer}>
          <QuietPressable
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={styles.settings}
          >
            <Tiny>settings</Tiny>
          </QuietPressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  whisperSlot: {
    height: 20,
    justifyContent: 'center',
  },
  whisper: {
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.inkFaint,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingBottom: spacing.sm,
  },
  settings: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    opacity: 0.7,
  },
  passingBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  passingLine: {
    height: 20,
    justifyContent: 'center',
  },
  passingText: {
    fontSize: 12,
    letterSpacing: 2.2,
    color: colors.inkFaint,
  },
});
