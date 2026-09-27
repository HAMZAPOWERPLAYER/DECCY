import { Text, type TextProps } from 'react-native';

import { colors, fonts } from '@/theme';

type Tone = 'ink' | 'dim' | 'faint' | 'ghost' | 'gold';

const TONES: Record<Tone, string> = {
  ink: colors.ink,
  dim: colors.inkDim,
  faint: colors.inkFaint,
  ghost: colors.inkGhost,
  gold: colors.gold,
};

type BaseProps = TextProps & { tone?: Tone };

function make(
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  letterSpacing = 0,
  defaultTone: Tone = 'ink',
) {
  return function QuietText({ tone = defaultTone, style, ...rest }: BaseProps) {
    return (
      <Text
        {...rest}
        style={[
          {
            fontFamily,
            fontSize,
            lineHeight,
            letterSpacing,
            color: TONES[tone],
          },
          style,
        ]}
      />
    );
  };
}

/** Large serif — the lifespan, the emotional anchors. */
export const Display = make(fonts.serifLight, 52, 60, -0.5);

/** Section-scale serif heading. */
export const Heading = make(fonts.serif, 26, 36, -0.2);

/** Serif paragraph — eulogy and long-form reading. */
export const Serif = make(fonts.serif, 17, 31, 0);

/** Serif paragraph in italic — the cause of passing. */
export const SerifItalic = make(fonts.serifItalic, 17, 31, 0);

/** Quiet sans body. */
export const Body = make(fonts.sans, 16, 26, 0.1, 'dim');

/** Small letterspaced sans label. */
export const Label = make(fonts.sansMedium, 11, 16, 2.4, 'faint');

/** The smallest readable sans — timestamps, credits. */
export const Tiny = make(fonts.sans, 12, 18, 0.3, 'faint');

/** Buttons and links, sans, unhurried. */
export const Link = make(fonts.sansMedium, 15, 22, 0.6, 'dim');
