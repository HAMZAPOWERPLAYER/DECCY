import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type TextStyle } from 'react-native';

import { QuietPressable } from '@/components/controls';
import { Screen, useScreenPadding } from '@/components/screen';
import { Heading, Serif, Tiny } from '@/components/text';
import { colors, spacing } from '@/theme';

export function BackLink({ label = 'back' }: { label?: string }) {
  return (
    <QuietPressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={styles.back}
    >
      <Tiny>{label}</Tiny>
    </QuietPressable>
  );
}

export function Page({
  title,
  subtitle,
  children,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
}) {
  const padding = useScreenPadding();
  const body = (
    <View style={styles.body}>
      <View style={styles.head}>
        <Heading style={styles.title} accessibilityRole="header">
          {title}
        </Heading>
        {subtitle ? <Tiny style={styles.subtitle}>{subtitle}</Tiny> : null}
      </View>
      {children}
    </View>
  );

  return (
    <Screen>
      <View
        style={[
          styles.root,
          { paddingTop: padding.paddingTop, paddingBottom: padding.paddingBottom },
        ]}
      >
        <BackLink />
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </View>
    </Screen>
  );
}

/** Long-form reading: terms, privacy, the letter from the developer. */
export function Prose({ children }: { children: ReactNode }) {
  return <View style={styles.prose}>{children}</View>;
}

export function P({
  children,
  style,
}: {
  children: ReactNode;
  style?: TextStyle;
}) {
  return <Serif style={[styles.paragraph, style]}>{children}</Serif>;
}

export function H({ children }: { children: ReactNode }) {
  return <Heading style={styles.subheading} accessibilityRole="header">
    {children}
  </Heading>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    opacity: 0.7,
  },
  scroll: {
    paddingBottom: spacing.huge,
  },
  body: {
    gap: spacing.xl,
  },
  head: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: 30,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  prose: {
    gap: spacing.md,
  },
  subheading: {
    fontSize: 19,
    lineHeight: 28,
    marginTop: spacing.md,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 29,
    color: colors.inkDim,
  },
});
