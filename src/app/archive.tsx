import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { QuietPressable } from '@/components/controls';
import { P, Page, Prose } from '@/components/page';
import { SerifItalic, Tiny } from '@/components/text';
import { colors, spacing } from '@/theme';
import { loadArchive, type CertificateEntry } from '@/lib/archive';
import { formatStamp } from '@/lib/format';

function stayText(ms?: number): string {
  if (!ms) return 'no long stay recorded';
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return 'under a minute';
  return `about ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export default function ArchiveScreen() {
  const [list, setList] = useState<CertificateEntry[]>([]);
  useEffect(() => { loadArchive().then(setList); }, []);
  return (
    <Page title="The Quiet Archive" subtitle="A still record of companions past.">
      <Prose><P>Each is kept quietly. There is no count, no order of importance — only presence, remembered.</P></Prose>
      <View style={styles.list}>
        {list.length === 0 ? (
          <P style={styles.empty}>Nothing has been kept here yet. When a companion passes, you may choose to keep it.</P>
        ) : (
          list.map((e) => (
            <QuietPressable
              key={e.id}
              onPress={() => router.push({ pathname: '/certificate', params: { archiveId: e.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Open certificate for companion lived ${e.lifespanDays} days`}
              style={styles.card}
            >
              <P style={styles.lifespan}>Lived for {e.lifespanDays} days</P>
              <SerifItalic style={styles.cause}>{e.cause}</SerifItalic>
              <View style={styles.details}>
                <Tiny>
                  planted · {formatStamp(e.plantedAt ?? e.passedAt)}
                </Tiny>
                <Tiny>
                  passed quietly · {formatStamp(e.passedAt)}
                </Tiny>
                <Tiny>
                  {e.realVisits ?? 0} real visit{e.realVisits === 1 ? '' : 's'} · longest stay {stayText(e.longestVisitMs)}
                </Tiny>
              </View>
              <Tiny style={styles.open}>open certificate</Tiny>
            </QuietPressable>
          ))
        )}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  empty: {
    color: colors.inkDim,
    marginTop: spacing.lg,
  },
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    gap: spacing.sm,
  },
  lifespan: {
    fontSize: 22,
    color: colors.gold,
  },
  cause: {
    fontSize: 15,
    lineHeight: 25,
    color: colors.inkDim,
  },
  details: {
    gap: 2,
  },
  open: {
    marginTop: spacing.xs,
    letterSpacing: 1.5,
  },
});
