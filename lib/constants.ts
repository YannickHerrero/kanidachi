import type { Theme } from "@react-navigation/native";

const NAV_FONT_FAMILY = "Inter-Black";

export const NAV_THEME = {
  light: {
    background: "hsl(0 0% 100%)", // background
    border: "hsl(240 5.9% 90%)", // border
    card: "hsl(0 0% 100%)", // card
    notification: "hsl(0 84.2% 60.2%)", // destructive
    primary: "hsl(240 5.9% 10%)", // primary
    text: "hsl(240 10% 3.9%)", // foreground
  },
  dark: {
    background: "hsl(240 10% 3.9%)", // background
    border: "hsl(240 3.7% 15.9%)", // border
    card: "hsl(240 10% 3.9%)", // card
    notification: "hsl(0 72% 51%)", // destructive
    primary: "hsl(0 0% 98%)", // primary
    text: "hsl(0 0% 98%)", // foreground
  },
};

export const LIGHT_THEME: Theme = {
  dark: false,
  fonts: {
    regular: {
      fontFamily: NAV_FONT_FAMILY,
      fontWeight: "400",
    },
    medium: {
      fontFamily: NAV_FONT_FAMILY,
      fontWeight: "500",
    },
    bold: {
      fontFamily: NAV_FONT_FAMILY,
      fontWeight: "700",
    },
    heavy: {
      fontFamily: NAV_FONT_FAMILY,
      fontWeight: "800",
    },
  },
  colors: NAV_THEME.light,
};
export const DARK_THEME: Theme = {
  dark: true,
  fonts: {
    regular: {
      fontFamily: NAV_FONT_FAMILY,
      fontWeight: "400",
    },
    medium: {
      fontFamily: NAV_FONT_FAMILY,
      fontWeight: "500",
    },
    bold: {
      fontFamily: NAV_FONT_FAMILY,
      fontWeight: "700",
    },
    heavy: {
      fontFamily: NAV_FONT_FAMILY,
      fontWeight: "800",
    },
  },
  colors: NAV_THEME.dark,
};

/**
 * Adaptive colors for mnemonic markup highlighting.
 * Follows Tsurukame's approach:
 * - Light mode: dark text on pastel backgrounds
 * - Dark mode: colored text with no/minimal background
 */
export const MNEMONIC_COLORS = {
  radical: {
    light: { foreground: "#000000", background: "#D6F1FF" },
    dark: { foreground: "#4AC3FF", background: "transparent" },
  },
  kanji: {
    light: { foreground: "#000000", background: "#FFD6F1" },
    dark: { foreground: "#FF4AC3", background: "transparent" },
  },
  vocabulary: {
    light: { foreground: "#000000", background: "#F1D6FF" },
    dark: { foreground: "#C34AFF", background: "transparent" },
  },
  reading: {
    light: { foreground: "#FFFFFF", background: "#555555" },
    dark: { foreground: "#FFFFFF", background: "#555555" },
  },
  japanese: {
    light: { foreground: "inherit", background: "transparent" },
    dark: { foreground: "inherit", background: "transparent" },
  },
} as const

export type MnemonicColorKey = keyof typeof MNEMONIC_COLORS
