import * as React from "react";
import {Platform} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import {cn} from "@/lib/utils";
import {useThemeColors} from "@/hooks/useThemeColors";
import * as ProgressPrimitive from "../primitives/progress";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string;
  }
>(({className, value, indicatorClassName, style, ...props}, ref) => {
  const colors = useThemeColors();
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full",
        className,
      )}
      style={[{backgroundColor: colors.secondary}, style]}
      {...props}
    >
      <Indicator value={value} className={indicatorClassName} />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export {Progress};

function Indicator({
  value,
  className,
}: {value: number | undefined | null; className?: string}) {
  const colors = useThemeColors();
  const progress = useDerivedValue(() => value ?? 0);

  const indicator = useAnimatedStyle(() => {
    return {
      width: withSpring(
        `${ interpolate(
          progress.value,
          [0, 100],
          [1, 100],
          Extrapolation.CLAMP,
        ) }%`,
        {overshootClamping: true},
      ),
    };
  });

  if (Platform.OS === "web") {
    return (
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 web:transition-all",
          className,
        )}
        style={[{transform: `translateX(-${ 100 - (value ?? 0) }%)`, backgroundColor: colors.primary}]}
      />
    );
  }

  return (
    <ProgressPrimitive.Indicator asChild>
      <Animated.View
        style={[indicator, {backgroundColor: colors.foreground}]}
        className={cn("h-full", className)}
      />
    </ProgressPrimitive.Indicator>
  );
}
