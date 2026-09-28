import { H, P, Page, Prose } from '@/components/page';

const UPDATED = 'September 2026';

export default function PrivacyScreen() {
  return (
    <Page title="Privacy policy" subtitle={`last updated ${UPDATED}`}>
      <Prose>
        <H>In short</H>
        <P>
          Decay does not collect your personal data. It has no account, asks
          for no login, and talks to no server. There is nothing to opt out of
          because there is nothing being collected.
        </P>

        <H>What is stored, and where</H>
        <P>
          The app stores a small amount of information locally on your device
          so that it can remember its own life: the moment you planted your
          companion, the moments you visited and how long you stayed, the
          current stage of its fading, and your ambient-sound preference. This
          information never leaves your device. It is not uploaded, backed up
          to a server, or shared with anyone.
        </P>

        <H>No analytics, no tracking, no third parties</H>
        <P>
          Decay contains no analytics SDK, no advertising SDK, no crash
          reporting service, no fingerprinting, and no tracking of any kind.
          We do not know who you are, where you are, or how often you open
          the app, and we could not tell you even if we wanted to.
        </P>

        <H>No network requests</H>
        <P>
          The app makes no network requests while it runs. Its fonts,
          artwork, and ambient sound are bundled with the app and read
          directly from your device. Links to the developer's email, WhatsApp,
          Patreon, and website open outside the app, in your own browser or
          mail app, under their own privacy terms.
        </P>

        <H>Permissions</H>
        <P>
          Decay requests no location, contacts, camera, microphone, photo, or
          advertising identifier permissions. On Android it may use a
          vibration for a single, gentle haptic when a visit is registered.
        </P>

        <H>Deleting your data</H>
        <P>
          Uninstalling the app, or clearing its storage from your device
          settings, permanently deletes everything it holds. Because that
          data exists nowhere else, it cannot be recovered by anyone,
          including the developer.
        </P>

        <H>Children</H>
        <P>
          Decay is not directed at children under 13, and since it collects
          no data at all, it does not knowingly collect anything from anyone
          of any age.
        </P>

        <H>Contact</H>
        <P>
          For any privacy question, write to hamzapowerplayer.global@gmail.com.
        </P>
      </Prose>
    </Page>
  );
}
