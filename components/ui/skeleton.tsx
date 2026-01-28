import * as React from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {cn} from "@/lib/utils";
import {useThemeColors} from "@/hooks/useThemeColors";

const duration = 1000;

function Skeleton({
  className,
  style,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Animated.View>, "style"> & {
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const colors = useThemeColors();
  const sv = useSharedValue(1);

  React.useEffect(() => {
    sv.value = withRepeat(
      withSequence(withTiming(0.5, {duration}), withTiming(1, {duration})),
      -1,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sv.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle, {backgroundColor: colors.muted}, style]}
      className={cn("rounded-md", className)}
      {...props}
    />
  );
}

export {Skeleton};
