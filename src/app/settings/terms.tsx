import { H, P, Page, Prose } from '@/components/page';

const UPDATED = 'September 2026';

export default function TermsScreen() {
  return (
    <Page title="Terms and conditions" subtitle={`last updated ${UPDATED}`}>
      <Prose>
        <H>What Decay is</H>
        <P>
          Decay is an art piece about impermanence. It is provided as-is, for
          reflection, entertainment and emotional experience. It is not a
          mental-health tool, not a therapy, and not a substitute for
          speaking to someone who can help.
        </P>

        <H>The mechanic is deliberately irreversible</H>
        <P>
          The companion in Decay fades when it is neglected and eventually
          passes. When it passes, it does not return. There is no restart
          button, no restore, and no way to recover a past life. This is the
          entire point of the work, and it was disclosed to you before you
          planted it.
        </P>
        <P>
          Because everything Decay remembers lives only on your own device,
          uninstalling the app or clearing its storage erases that history
          permanently. No copy exists anywhere else, and none can be
          requested. The only way to begin again is to install the app anew
          and plant a new companion.
        </P>

        <H>Your data</H>
        <P>
          Decay collects nothing. It has no account system, no servers, and
          makes no network requests. Your visit history exists only in local
          storage on your device. The Privacy Policy describes this in full.
        </P>

        <H>No warranty</H>
        <P>
          Decay is provided without warranty of any kind, express or implied,
          including fitness for a particular purpose. To the fullest extent
          permitted by law, the developer is not liable for any claim, damage,
          loss of data, or other liability arising from your use of the app
          or from your reliance on it.
        </P>

        <H>Attribution</H>
        <P>
          Decay was designed and built by HAMZA POWERPLAYER. Please keep the
          name attached to it wherever you share it.
        </P>
      </Prose>
    </Page>
  );
}
