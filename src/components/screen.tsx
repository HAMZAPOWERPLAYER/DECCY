import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

export function Screen({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.root, style]} {...rest}>
      <LinearGradient
        colors={[colors.voidTop, colors.voidBottom]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

/** Vertical padding that respects the notch without drawing attention to it. */
export function useScreenPadding() {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: Math.max(insets.top, 20),
    paddingBottom: Math.max(insets.bottom, 20),
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.voidTop,
    overflow: 'hidden',
  },
});
