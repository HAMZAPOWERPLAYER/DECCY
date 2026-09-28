import * as Sharing from 'expo-sharing';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { QuietPressable } from '@/components/controls';
import { Screen, useScreenPadding } from '@/components/screen';
import { Display, Label, Serif, SerifItalic, Tiny } from '@/components/text';
import { addToArchive, loadArchive } from '@/lib/archive';
import { analyzeLife } from '@/lib/analysis';
import { composeCertificate } from '@/lib/eulogy';
import { exportCertificateImage } from '@/lib/export-certificate';
import { formatStamp } from '@/lib/format';
import { daysPhrase } from '@/lib/words';
import { useCompanion } from '@/state/companion';
import { colors, spacing } from '@/theme';

const { width: WINDOW } = Dimensions.get('window');
const CARD_WIDTH = Math.min(WINDOW - 32, 420);

function Flourish() {
  const mid = 130;
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={260} height={24} viewBox="0 0 260 24">
        <Line
          x1={0}
          y1={12}
          x2={mid - 28}
          y2={12}
          stroke="rgba(232, 200, 136, 0.34)"
          strokeWidth={0.75}
        />
        <Line
          x1={mid + 28}
          y1={12}
          x2={260}
          y2={12}
          stroke="rgba(232, 200, 136, 0.34)"
          strokeWidth={0.75}
        />
        <Circle cx={mid - 24} cy={12} r={1.4} fill="rgba(232, 200, 136, 0.55)" />
        <Circle cx={mid + 24} cy={12} r={1.4} fill="rgba(232, 200, 136, 0.55)" />
        <Path
          d={
            `M ${mid} 3 C ${mid + 1.3} 8.4, ${mid + 5.2} 10.6, ${mid + 9.5} 12 ` +
            `C ${mid + 5.2} 13.4, ${mid + 1.3} 15.6, ${mid} 21 ` +
            `C ${mid - 1.3} 15.6, ${mid - 5.2} 13.4, ${mid - 9.5} 12 ` +
            `C ${mid - 5.2} 10.6, ${mid - 1.3} 8.4, ${mid} 3 Z`
          }
          fill="rgba(232, 200, 136, 0.8)"
        />
      </Svg>
    </View>
  );
}

export default function CertificateScreen() {
  const { state, status, now } = useCompanion();
  const params = useLocalSearchParams<{ archiveId?: string | string[] }>();
  const archiveId = Array.isArray(params.archiveId) ? params.archiveId[0] : params.archiveId;
  const padding = useScreenPadding();
  const shotRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [kept, setKept] = useState(false);
  const [archivedEntry, setArchivedEntry] = useState<Awaited<ReturnType<typeof loadArchive>>[number] | null>(null);

  const certificate = useMemo(() => {
    if (archivedEntry) {
      return {
        lifespanDays: archivedEntry.lifespanDays,
        lifespanText: daysPhrase(Math.round(archivedEntry.lifespanDays)),
        cause: archivedEntry.cause,
        sentences: archivedEntry.sentences,
        passedAt: archivedEntry.passedAt,
      };
    }
    if (state.plantedAt === null) return null;
    return composeCertificate(
      state.plantedAt,
      state.visits,
      state.passedAt ?? now,
      state.seed,
    );
  }, [archivedEntry, state.plantedAt, state.visits, state.passedAt, state.seed, now]);

  const passedAt = certificate?.passedAt ?? state.passedAt ?? now;

  useEffect(() => {
    let cancelled = false;
    if (archiveId) {
      loadArchive()
        .then((entries) => {
          if (!cancelled) setArchivedEntry(entries.find((entry) => entry.id === archiveId) ?? null);
        })
        .catch(() => {
          if (!cancelled) setArchivedEntry(null);
        });
    } else {
      setArchivedEntry(null);
    }
    return () => {
      cancelled = true;
    };
  }, [archiveId]);

  useEffect(() => {
    loadArchive()
      .then((entries) => setKept(Boolean(archiveId) || entries.some((entry) => entry.passedAt === passedAt)))
      .catch(() => {});
  }, [archiveId, passedAt]);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 3600);
    return () => clearTimeout(timer);
  }, [saved]);

  const share = async () => {
    if (busy || !shotRef.current) return;
    try {
      setBusy(true);
      const uri = await exportCertificateImage(shotRef.current);
      if (!uri) return;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Keep the certificate',
          UTI: 'public.png',
        });
        setSaved(true);
      }
    } catch {
      // A cancelled share sheet is not an error worth surfacing.
    } finally {
      setBusy(false);
    }
  };

  const keep = async () => {
    if (busy || kept || certificate === null || archiveId || state.plantedAt === null) return;
    try {
      setBusy(true);
      const imageUri = shotRef.current
        ? await exportCertificateImage(shotRef.current)
        : null;
      const life = analyzeLife(state.plantedAt, state.visits, passedAt);
      await addToArchive({
        id: `${passedAt}-${state.seed}`,
        plantedAt: state.plantedAt,
        realVisits: life.visits,
        longestVisitMs: life.longestVisitMs,
        longestVisitDay: life.longestVisitDay,
        lifespanDays: certificate.lifespanDays,
        cause: certificate.cause,
        sentences: certificate.sentences,
        passedAt,
        ...(imageUri ? { certificateImageUri: imageUri } : {}),
      });
      setKept(true);
    } finally {
      setBusy(false);
    }
  };

  if (status !== 'ready') return <Screen />;
  if (archiveId && archivedEntry === null) return <Screen />;
  if (state.plantedAt === null || certificate === null) return <Redirect href="/onboarding" />;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: padding.paddingTop + spacing.lg, paddingBottom: padding.paddingBottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(2600)}>
          <View ref={shotRef} collapsable={false} style={styles.certificate}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.voidTop }]} />
            <Flourish />

            <Label style={styles.metaLabel}>LIVED FOR</Label>
            <Display style={styles.lifespan}>{certificate.lifespanText}</Display>

            <Label style={styles.metaLabel}>CAUSE OF PASSING</Label>
            <SerifItalic style={styles.cause}>{certificate.cause}</SerifItalic>

            <Serif style={styles.eulogy}>{certificate.sentences.join(' ')}</Serif>

            <Flourish />
            <Tiny style={styles.signature}>DECAY</Tiny>
            <Tiny style={styles.stamp}>passed quietly · {formatStamp(passedAt)}</Tiny>
          </View>
        </Animated.View>

        <View style={styles.actionRow}>
          {busy ? (
            <ActivityIndicator color={colors.inkFaint} />
          ) : (
            <>
              {!archiveId ? (
                <QuietPressable
                  onPress={keep}
                  accessibilityRole="button"
                  accessibilityLabel="Keep the certificate in the Quiet Archive"
                  style={styles.actionButton}
                >
                  <Label tone={kept ? 'gold' : 'faint'} style={styles.actionLabel}>
                    {kept ? 'KEPT' : 'KEEP'}
                  </Label>
                </QuietPressable>
              ) : null}
              <QuietPressable
                onPress={share}
                accessibilityRole="button"
                accessibilityLabel="Save or share the certificate"
                style={styles.actionButton}
              >
                <Label tone={saved ? 'gold' : 'faint'} style={styles.actionLabel}>
                  {saved ? 'SHARED' : 'SAVE / SHARE'}
                </Label>
              </QuietPressable>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  certificate: {
    width: CARD_WIDTH,
    aspectRatio: 9 / 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: 34,
    paddingVertical: 52,
    overflow: 'hidden',
  },
  metaLabel: {
    marginTop: spacing.sm,
    fontSize: 10,
    letterSpacing: 3,
  },
  lifespan: {
    fontSize: 46,
    lineHeight: 56,
    textAlign: 'center',
    color: colors.ink,
  },
  cause: {
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 30,
    maxWidth: 330,
    color: colors.inkDim,
  },
  eulogy: {
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 32,
    maxWidth: 340,
    marginTop: spacing.md,
    color: colors.ink,
  },
  stamp: {
    marginTop: spacing.sm,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  signature: {
    marginTop: spacing.sm,
    letterSpacing: 2.4,
    color: colors.gold,
  },
  actionRow: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionLabel: {
    fontSize: 11,
    letterSpacing: 3,
  },
});
