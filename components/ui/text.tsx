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

const Text = React.forwardRef<TextRef, SlottableTextProps>(
  ({className, asChild = false, style, ...props}, ref) => {
    const textClass = React.useContext(TextClassContext);
    const Component = asChild ? Slot.Text : RNText;
    const colors = useThemeColors();
    return (
      <Component
        className={cn(
          "text-base web:select-text",
          textClass,
          className,
        )}
        style={[{color: colors.foreground}, style]}
        ref={ref}
        {...props}
      />
    );
  },
);
Text.displayName = "Text";

export {Text, TextClassContext};
