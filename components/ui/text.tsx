import * as React from "react";
import {Text as RNText} from "react-native";
import * as Slot from "@/components/primitives/slot";
import type {
  SlottableTextProps,
  TextRef,
} from "@/components/primitives/types";
import {cn} from "@/lib/utils";
import {useThemeColors} from "@/hooks/useThemeColors";

const TextClassContext = React.createContext<string | undefined>(undefined);

const JAPANESE_FONT_FAMILY_REGULAR = "NotoSansJP_400Regular";
const JAPANESE_FONT_FAMILY_BOLD = "NotoSansJP_700Bold";

const JAPANESE_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

function extractTextContent(children: React.ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractTextContent).join("");
  if (React.isValidElement(children)) {
    return extractTextContent(children.props?.children);
  }
  return "";
}

function containsJapaneseText(children: React.ReactNode): boolean {
  const text = extractTextContent(children);
  return JAPANESE_REGEX.test(text);
}

function hasFontFamily(style: unknown): boolean {
  if (!style) return false;
  if (Array.isArray(style)) return style.some(hasFontFamily);
  if (typeof style === "number") return false;
  if (typeof style === "object") {
    return Boolean((style as {fontFamily?: string}).fontFamily);
  }
  return false;
}

function resolveJapaneseFontFamily(className: string | undefined): string {
  if (!className) return JAPANESE_FONT_FAMILY_REGULAR;
  if (
    className.includes("font-bold") ||
    className.includes("font-semibold") ||
    className.includes("font-extrabold") ||
    className.includes("font-black")
  ) {
    return JAPANESE_FONT_FAMILY_BOLD;
  }
  return JAPANESE_FONT_FAMILY_REGULAR;
}

const Text = React.forwardRef<TextRef, SlottableTextProps>(
  ({className, asChild = false, style, ...props}, ref) => {
    const textClass = React.useContext(TextClassContext);
    const Component = asChild ? Slot.Text : RNText;
    const colors = useThemeColors();
    const combinedClassName = [textClass, className].filter(Boolean).join(" ");
    const shouldApplyJapaneseFont =
      !hasFontFamily(style) && containsJapaneseText(props.children);
    const japaneseFontFamily = shouldApplyJapaneseFont
      ? resolveJapaneseFontFamily(combinedClassName)
      : undefined;
    return (
      <Component
        className={cn(
          "text-base web:select-text",
          textClass,
          className,
        )}
        style={[
          {color: colors.foreground},
          japaneseFontFamily ? {fontFamily: japaneseFontFamily} : undefined,
          style,
        ]}
        ref={ref}
        {...props}
      />
    );
  },
);
Text.displayName = "Text";

export {Text, TextClassContext};
