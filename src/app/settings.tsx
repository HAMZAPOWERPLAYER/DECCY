import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ListRow, Toggle } from '@/components/controls';
import { Page } from '@/components/page';
import { spacing } from '@/theme';
import { useCompanion } from '@/state/companion';

export default function SettingsScreen() {
  const { state, setAmbient } = useCompanion();

  return (
    <Page title="Settings" subtitle="there is nothing here that counts you.">
      <View style={styles.group}>
        <Toggle
          label="Ambient sound"
          value={state.ambientOn}
          onChange={setAmbient}
        />
      </View>

      <View style={styles.note}>
        <ListRow
          first
          title="Developer support"
          note="a message is always welcome."
          onPress={() => router.push('/settings/developer-support')}
        />
        <ListRow
          title="Terms and conditions"
          onPress={() => router.push('/settings/terms')}
        />
        <ListRow
          title="Privacy policy"
          onPress={() => router.push('/settings/privacy')}
        />
        <ListRow title="About" onPress={() => router.push('/settings/about')} />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  group: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(240, 237, 230, 0.10)',
  },
  note: {
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(240, 237, 230, 0.10)',
  },
});
