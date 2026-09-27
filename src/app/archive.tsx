import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { H, P, Page, Prose } from '@/components/page';
import { colors, spacing } from '@/theme';
import { loadArchive, type CertificateEntry } from '@/lib/archive';

export default function ArchiveScreen() {
  const [list, setList] = useState<CertificateEntry[]>([]);
  useEffect(() => { loadArchive().then(setList); }, []);
  return (
    <Page title="The Quiet Archive" subtitle="A still record of companions past.">
      <Prose><P>Each is kept quietly. There is no count, no order of importance — only presence, remembered.</P></Prose>
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.md }}>
        {list.length === 0 ? (
          <P style={{ color: colors.dim, marginTop: spacing.lg }}>Nothing has been kept here yet. When a companion passes, you may choose to keep it.</P>
        ) : (
          list.map((e) => (
            <View key={e.id} style={styles.card}>
              <P style={{ fontFamily: 'Fraunces', fontSize: 22, color: colors.gold }}>Lived for {e.lifespanDays} days</P>
              <P style={{ fontSize: 14, color: colors.text, marginTop: 4 }}>{e.cause}</P>
              <P style={{ fontSize: 12, color: colors.dim, marginTop: 4 }}>{new Date(e.passedAt).toLocaleDateString()}</P>
            </View>
          ))
        )}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.hairline, marginBottom: spacing.sm },
});
