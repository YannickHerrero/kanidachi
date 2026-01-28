import * as React from "react";
import * as LabelPrimitive from "@/components/primitives/label";
import {cn} from "@/lib/utils";
import {useThemeColors} from "@/hooks/useThemeColors";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Text>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Text>
>(
  (
    {className, onPress, onLongPress, onPressIn, onPressOut, style, ...props},
    ref,
  ) => {
    const colors = useThemeColors();
    return (
      <LabelPrimitive.Root
        className="web:cursor-default"
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <LabelPrimitive.Text
          ref={ref}
          className={cn(
            "text-sm native:text-base font-medium leading-none web:peer-disabled:cursor-not-allowed web:peer-disabled:opacity-70",
            className,
          )}
          style={[{color: colors.foreground}, style]}
          {...props}
        />
      </LabelPrimitive.Root>
    );
  },
);
Label.displayName = LabelPrimitive.Root.displayName;

export {Label};
