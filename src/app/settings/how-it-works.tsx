import { H, P, Page, Prose } from '@/components/page';

export default function HowItWorksScreen() {
  return (
    <Page
      title="How it works"
      subtitle="A small explanation, without giving everything away."
    >
      <Prose>
        <H>Presence</H>
        <P>
          A visit counts when you stay with your companion for about twelve
          seconds. Opening the app and passing through is not the same as being
          there.
        </P>

        <H>Fading</H>
        <P>
          Time away increases its neglect. Each real visit eases some of that
          neglect, but it does not erase the past or return the companion to
          its beginning.
        </P>

        <H>Impermanence</H>
        <P>
          Care can slow the ending, but nothing here lives forever. A longer
          life is possible through returning, never guaranteed through it.
        </P>

        <H>Passing</H>
        <P>
          When the companion reaches its final stage, it passes quietly. The
          app creates a Death Certificate from the life you shared: its
          lifespan, its cause, its eulogy, and the moment it was noticed.
        </P>

        <H>Privacy</H>
        <P>
          Decay is offline-first. Your companion and its visits stay on this
          device. There is no account, score, or leaderboard.
        </P>
      </Prose>
    </Page>
  );
}