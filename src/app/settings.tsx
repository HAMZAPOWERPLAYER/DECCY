import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ListRow, Toggle } from '@/components/controls';
import { Page } from '@/components/page';
import { requestPermission } from '@/lib/notification';
import { spacing } from '@/theme';
import { useCompanion } from '@/state/companion';
import { Tiny } from '@/components/text';

export default function SettingsScreen() {
  const { state, setAmbient, setGentleReminder } = useCompanion();
  const [reminderPending, setReminderPending] = useState(false);

  const changeReminder = async (next: boolean) => {
    if (!next) {
      setGentleReminder(false);
      return;
    }

    setReminderPending(true);
    try {
      const allowed = await requestPermission();
      if (allowed) setGentleReminder(true);
    } finally {
      setReminderPending(false);
    }
  };

  return (
    <Page title="Settings" subtitle="there is nothing here that counts you.">
      <View style={styles.group}>
        <Toggle
          label="Ambient sound"
          value={state.ambientOn}
          onChange={setAmbient}
        />
        <Toggle
          label={reminderPending ? 'Gentle reminder · checking' : 'Gentle reminder'}
          value={state.gentleReminderOn}
          onChange={(next) => {
            void changeReminder(next);
          }}
        />
        <Tiny style={styles.toggleNote}>
          off by default · one quiet reminder after four days away
        </Tiny>
      </View>

      <View style={styles.note}>
        <ListRow
          first
          title="How it works"
          note="presence, fading, and passing."
          onPress={() => router.push('/settings/how-it-works')}
        />
        <ListRow
          title="Developer support"
          note="a message is always welcome."
          onPress={() => router.push('/settings/developer-support')}
        />
        <ListRow
          title="The Quiet Archive"
          note="companions remembered."
          onPress={() => router.push('/archive')}
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
  toggleNote: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    fontSize: 11,
    lineHeight: 17,
  },
  note: {
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(240, 237, 230, 0.10)',
  },
});
