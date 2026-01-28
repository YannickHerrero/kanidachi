import {type VariantProps, cva} from "class-variance-authority";
import {View} from "react-native";
import * as Slot from "@/components/primitives/slot";
import type {SlottableViewProps} from "@/components/primitives/types";
import {TextClassContext} from "@/components/ui/text";
import {cn} from "@/lib/utils";
import {useThemeColors} from "@/hooks/useThemeColors";
import type {ThemeColors} from "@/lib/colors";

const badgeVariants = cva(
  "web:inline-flex items-center rounded-full border px-2.5 py-0.5 web:transition-colors web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent web:hover:opacity-80 active:opacity-80",
        secondary:
          "border-transparent web:hover:opacity-80 active:opacity-80",
        destructive:
          "border-transparent web:hover:opacity-80 active:opacity-80",
        outline: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const badgeTextVariants = cva("text-xs font-semibold ", {
  variants: {
    variant: {
      default: "",
      secondary: "",
      destructive: "",
      outline: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const getBadgeBackgroundColor = (variant: string | undefined | null, colors: ThemeColors): string => {
  switch (variant) {
    case "default":
      return colors.primary;
    case "secondary":
      return colors.secondary;
    case "destructive":
      return colors.destructive;
    case "outline":
      return "transparent";
    default:
      return colors.primary;
  }
};

const getBadgeBorderColor = (variant: string | undefined | null, colors: ThemeColors): string => {
  if (variant === "outline") {
    return colors.border;
  }
  return "transparent";
};

const getBadgeTextColor = (variant: string | undefined | null, colors: ThemeColors): string => {
  switch (variant) {
    case "default":
      return colors.primaryForeground;
    case "secondary":
      return colors.secondaryForeground;
    case "destructive":
      return colors.destructiveForeground;
    case "outline":
      return colors.foreground;
    default:
      return colors.primaryForeground;
  }
};

type BadgeProps = SlottableViewProps & VariantProps<typeof badgeVariants>;

function Badge({className, variant, asChild, style, ...props}: BadgeProps) {
  const Component = asChild ? Slot.View : View;
  const colors = useThemeColors();
  const backgroundColor = getBadgeBackgroundColor(variant, colors);
  const borderColor = getBadgeBorderColor(variant, colors);
  const textColor = getBadgeTextColor(variant, colors);

  return (
    <TextClassContext.Provider value={badgeTextVariants({variant})}>
      <Component
        className={cn(badgeVariants({variant}), className)}
        style={[{backgroundColor, borderColor}, style]}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export {Badge, badgeTextVariants, badgeVariants, getBadgeTextColor};
export type {BadgeProps};
