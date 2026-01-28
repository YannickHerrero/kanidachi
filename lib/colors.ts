// Light Mode Colors
export const lightColors = {
  background: '#ffffff',
  foreground: '#0a0a0b',
  card: '#ffffff',
  cardForeground: '#0a0a0b',
  popover: '#ffffff',
  popoverForeground: '#0a0a0b',
  primary: '#18181b',
  primaryForeground: '#fafafa',
  secondary: '#f4f4f5',
  secondaryForeground: '#18181b',
  muted: '#f4f4f5',
  mutedForeground: '#71717a',
  accent: '#f4f4f5',
  accentForeground: '#18181b',
  destructive: '#ef4444',
  destructiveForeground: '#fafafa',
  border: '#e4e4e7',
  input: '#e4e4e7',
  ring: '#18181b',
} as const;

// Dark Mode Colors
export const darkColors = {
  background: '#0a0a0b',
  foreground: '#fafafa',
  card: '#0a0a0b',
  cardForeground: '#fafafa',
  popover: '#0a0a0b',
  popoverForeground: '#fafafa',
  primary: '#fafafa',
  primaryForeground: '#18181b',
  secondary: '#27272a',
  secondaryForeground: '#fafafa',
  muted: '#27272a',
  mutedForeground: '#a1a1aa',
  accent: '#27272a',
  accentForeground: '#fafafa',
  destructive: '#dc2626',
  destructiveForeground: '#fafafa',
  border: '#27272a',
  input: '#27272a',
  ring: '#d4d4d8',
} as const;

export type ThemeColors = typeof lightColors | typeof darkColors;

export const getThemeColors = (mode: 'light' | 'dark'): ThemeColors => {
  return mode === 'light' ? lightColors : darkColors;
};
