import {type VariantProps, cva} from "class-variance-authority";
import * as React from "react";
import {Pressable, type StyleProp, type TextStyle, type ViewStyle} from "react-native";
import {TextClassContext} from "@/components/ui/text";
import {cn} from "@/lib/utils";
import {useThemeColors} from "@/hooks/useThemeColors";
import type {ThemeColors} from "@/lib/colors";

const buttonVariants = cva(
  "group flex items-center justify-center rounded-md web:ring-offset-background web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "web:hover:opacity-90 active:opacity-90",
        destructive: "web:hover:opacity-90 active:opacity-90",
        outline:
          "border web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent",
        secondary: "web:hover:opacity-80 active:opacity-80",
        ghost:
          "web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent",
        link: "web:underline-offset-4 web:hover:underline web:focus:underline ",
      },
      size: {
        default: "h-10 px-4 py-2 native:h-12 native:px-5 native:py-3",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 native:h-14",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva(
  "web:whitespace-nowrap text-sm native:text-base font-medium web:transition-colors",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        outline: "group-active:text-accent-foreground",
        secondary: "group-active:text-secondary-foreground",
        ghost: "group-active:text-accent-foreground",
        link: "group-active:underline",
      },
      size: {
        default: "",
        sm: "",
        lg: "native:text-lg",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const getButtonBackgroundColor = (variant: string | undefined | null, colors: ThemeColors): string => {
  switch (variant) {
    case "default":
      return colors.primary;
    case "destructive":
      return colors.destructive;
    case "outline":
      return colors.background;
    case "secondary":
      return colors.secondary;
    case "ghost":
    case "link":
      return "transparent";
    default:
      return colors.primary;
  }
};

const getButtonBorderColor = (variant: string | undefined | null, colors: ThemeColors): string | undefined => {
  if (variant === "outline") {
    return colors.input;
  }
  return undefined;
};

const getButtonTextColor = (variant: string | undefined | null, colors: ThemeColors): string => {
  switch (variant) {
    case "default":
      return colors.primaryForeground;
    case "destructive":
      return colors.destructiveForeground;
    case "secondary":
      return colors.secondaryForeground;
    case "outline":
    case "ghost":
    case "link":
      return colors.foreground;
    default:
      return colors.primaryForeground;
  }
};

type ButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ButtonProps
>(({className, variant, size, style, ...props}, ref) => {
  const colors = useThemeColors();
  const backgroundColor = getButtonBackgroundColor(variant, colors);
  const borderColor = getButtonBorderColor(variant, colors);
  const textColor = getButtonTextColor(variant, colors);

  const buttonStyle: StyleProp<ViewStyle> = [
    {backgroundColor},
    borderColor ? {borderColor} : undefined,
    style as ViewStyle,
  ];

  return (
    <TextClassContext.Provider
      value={cn(
        props.disabled && "web:pointer-events-none",
        buttonTextVariants({variant, size}),
      )}
    >
      <Pressable
        className={cn(
          props.disabled && "opacity-50 web:pointer-events-none",
          buttonVariants({variant, size, className}),
        )}
        style={buttonStyle}
        ref={ref}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
});
Button.displayName = "Button";

export {Button, buttonTextVariants, buttonVariants, getButtonTextColor};
export type {ButtonProps};
