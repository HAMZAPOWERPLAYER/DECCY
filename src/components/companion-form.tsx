import { useEffect, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { StageIndex } from '@/lib/decay';
import { colors, stageVisual } from '@/theme';

const BLOOM = require('../../assets/images/glow-bloom.png');
const BODY = require('../../assets/images/glow-body.png');
const CORE = require('../../assets/images/glow-core.png');
const CRACKS = require('../../assets/images/cracks.png');

type Props = {
  stage: StageIndex;
  /** overall width of the form, in points */
  size: number;
  /** scale of the drifting lights around it */
  ambient?: number;
};

function DriftingLight({
  index,
  bounds,
  alpha,
}: {
  index: number;
  bounds: number;
  alpha: number;
}) {
  const opacity = useSharedValue(0);
  const travel = useSharedValue(0);

  const seed = useMemo(() => {
    const angle = index * 2.399963;
    const radius = 0.3 + (((index * 53) % 97) / 97) * 0.22;
    return {
      x: Math.cos(angle) * radius * bounds,
      y: Math.sin(angle) * radius * bounds * 0.92,
      diameter: 2 + (index % 3),
      delay: index * 1400,
      duration: 9000 + index * 1300,
    };
  }, [index, bounds]);

  useEffect(() => {
    opacity.value = withDelay(
      seed.delay,
      withRepeat(
        withTiming(1, { duration: seed.duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    travel.value = withDelay(
      seed.delay,
      withRepeat(
        withTiming(1, { duration: seed.duration * 1.6, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      ),
    );
  }, [opacity, travel, seed]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value * alpha * 0.7,
    transform: [{ translateY: -16 + travel.value * 32 }],
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.light,
        {
          width: seed.diameter,
          height: seed.diameter,
          borderRadius: seed.diameter,
          left: bounds + seed.x - seed.diameter / 2,
          top: bounds + seed.y - seed.diameter / 2,
          backgroundColor: colors.ink,
        },
        style,
      ]}
    />
  );
}

export function CompanionForm({ stage, size, ambient = 1 }: Props) {
  const visual = stageVisual(stage);
  const { tint, core, opacity: stageOpacity, cracks } = visual;

  const breath = useSharedValue(0);
  const flicker = useSharedValue(1);
  const drift = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: visual.breath * 1000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breath, visual.breath]);

  useEffect(() => {
    if (visual.flicker) {
      flicker.value = withRepeat(
        withSequence(
          withDelay(2400, withTiming(0.3, { duration: 130, easing: Easing.out(Easing.quad) })),
          withTiming(1, { duration: 300, easing: Easing.in(Easing.quad) }),
          withDelay(3600, withTiming(0.55, { duration: 110 })),
          withTiming(1, { duration: 260 }),
        ),
        -1,
        false,
      );
    } else {
      flicker.value = withTiming(1, { duration: 500 });
    }
  }, [flicker, visual.flicker]);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 34000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [drift]);

  const formStyle = useAnimatedStyle(() => ({
    opacity: stageOpacity * (0.86 + 0.14 * breath.value) * flicker.value,
    transform: [
      { scale: 1 + visual.breathAmplitude * breath.value },
      { translateY: -5 + drift.value * 10 },
      { rotate: `${drift.value * 7 - 3.5}deg` },
    ],
  }));

  const bounds = size / 2;

  return (
    <View
      style={{ width: size, height: size }}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: 7 }, (_, index) => (
        <DriftingLight
          key={index}
          index={index}
          bounds={bounds}
          alpha={Math.min(1, stageOpacity * 1.1) * ambient}
        />
      ))}

      <Animated.View style={[StyleSheet.absoluteFill, formStyle]}>
        <Image
          source={BLOOM}
          fadeDuration={0}
          resizeMode="contain"
          style={[StyleSheet.absoluteFill, { tintColor: tint, opacity: 0.55 }]}
        />
        <Image
          source={BODY}
          fadeDuration={0}
          resizeMode="contain"
          style={[StyleSheet.absoluteFill, { tintColor: tint, opacity: 0.95 }]}
        />
        <Image
          source={CORE}
          fadeDuration={0}
          resizeMode="contain"
          style={[
            styles.core,
            { tintColor: core, opacity: 0.9 },
          ]}
        />
        <Image
          source={CRACKS}
          fadeDuration={0}
          resizeMode="contain"
          style={[StyleSheet.absoluteFill, { tintColor: colors.voidTop, opacity: cracks }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  core: {
    position: 'absolute',
    left: '31%',
    top: '31%',
    width: '38%',
    height: '38%',
  },
  light: {
    position: 'absolute',
  },
});
