import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { ListRow } from '@/components/controls';
import { H, P, Page, Prose } from '@/components/page';
import { colors, spacing } from '@/theme';

const SITE = 'https://hamzapowerplayer.com';

export default function AboutScreen() {
  return (
    <Page title="About" subtitle="one light, left to fade.">
      <Prose>
        <P>
          Decay is a small, offline, login-free companion app. It is not a
          pet and not a game. It is a single soft light that dims when you
          stop visiting and finally goes out, and then leaves you with
          something honest.
        </P>
        <P>
          Everything you see is generated on your device, from your own
          history. There is no model, no cloud, and no feed.
        </P>
      </Prose>

      <H>Credits</H>
      <Prose>
        <P>
          Designed, written and built by HAMZA POWERPLAYER. Type set in
          Fraunces and Source Sans 3. Companion artwork and the ambient tone
          were generated for this app.
        </P>
      </Prose>

      <View style={styles.list}>
        <ListRow
          first
          title="HAMZA POWERPLAYER"
          note="hamzapowerplayer.com"
          onPress={() => WebBrowser.openBrowserAsync(SITE)}
        />
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
});
