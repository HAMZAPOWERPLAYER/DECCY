import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { ListRow } from '@/components/controls';
import { H, P, Page, Prose } from '@/components/page';
import { colors, spacing } from '@/theme';

const EMAIL = 'hamzapowerplayer.global@gmail.com';
const WHATSAPP = '+923129584661';
const PATREON = 'https://www.patreon.com/posts/heartfelt-thank-153029964';

export default function DeveloperSupportScreen() {
  return (
    <Page title="Developer support" subtitle="made by one person, on purpose.">
      <Prose>
        <P>
          Decay is the work of HAMZA POWERPLAYER, built slowly and without a
          single analytics SDK in it. If something in it felt broken, too
          quiet, or not quite what you expected, you are very welcome to say
          so. Bug reports, kind words, and long messages are all equally fine.
        </P>
      </Prose>

      <View style={styles.list}>
        <ListRow
          first
          title="Email"
          note={EMAIL}
          onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
          accessibilityLabel={`Email ${EMAIL}`}
        />
        <ListRow
          title="WhatsApp"
          note={WHATSAPP}
          onPress={() => Linking.openURL(`https://wa.me/923129584661`)}
          accessibilityLabel={`WhatsApp ${WHATSAPP}`}
        />
        <ListRow
          title="Support the developer"
          note="patreon"
          onPress={() => WebBrowser.openBrowserAsync(PATREON)}
        />
      </View>

      <H>Thank you</H>
      <Prose>
        <P>
          No ratings, no badges, no popups asking anything of you. If you
          want to help, the only thing that helps is telling someone you know
          about it — and staying with the ones you have already planted.
        </P>
      </Prose>
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
