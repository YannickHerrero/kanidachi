import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/theme';
import { getThemeColors } from '@/lib/colors';

export const useThemeColors = () => {
  const mode = useThemeStore((state) => state.mode);
  const systemColorScheme = useColorScheme();

  // Resolve "system" to actual device preference
  const resolvedMode = mode === 'system'
    ? (systemColorScheme ?? 'light')
    : mode;

  return getThemeColors(resolvedMode);
};
