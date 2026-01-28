import * as React from "react";
import {Text, View} from "react-native";
import type {TextRef, ViewRef} from "@/components/primitives/types";
import {TextClassContext} from "@/components/ui/text";
import {cn} from "@/lib/utils";
import {useThemeColors} from "@/hooks/useThemeColors";

const Card = React.forwardRef<
  ViewRef,
  React.ComponentPropsWithoutRef<typeof View>
>(({className, style, ...props}, ref) => {
  const colors = useThemeColors();
  return (
    <View
      ref={ref}
      className={cn(
        "rounded-lg border shadow-sm shadow-foreground/10",
        className,
      )}
      style={[{borderColor: colors.border, backgroundColor: colors.card}, style]}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  ViewRef,
  React.ComponentPropsWithoutRef<typeof View>
>(({className, ...props}, ref) => (
  <View
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  TextRef,
  React.ComponentPropsWithoutRef<typeof Text>
>(({className, style, ...props}, ref) => {
  const colors = useThemeColors();
  return (
    <Text
      role="heading"
      aria-level={3}
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className,
      )}
      style={[{color: colors.cardForeground}, style]}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  TextRef,
  React.ComponentPropsWithoutRef<typeof Text>
>(({className, style, ...props}, ref) => {
  const colors = useThemeColors();
  return (
    <Text
      ref={ref}
      className={cn("text-sm", className)}
      style={[{color: colors.mutedForeground}, style]}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  ViewRef,
  React.ComponentPropsWithoutRef<typeof View>
>(({className, ...props}, ref) => (
  <TextClassContext.Provider value="">
    <View ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  </TextClassContext.Provider>
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  ViewRef,
  React.ComponentPropsWithoutRef<typeof View>
>(({className, ...props}, ref) => (
  <View
    ref={ref}
    className={cn("flex flex-row items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
