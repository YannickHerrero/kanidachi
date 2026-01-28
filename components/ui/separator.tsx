import * as React from "react";
import * as SeparatorPrimitive from "@/components/primitives/separator";
import {cn} from "@/lib/utils";
import {useThemeColors} from "@/hooks/useThemeColors";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    {className, orientation = "horizontal", decorative = true, style, ...props},
    ref,
  ) => {
    const colors = useThemeColors();
    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "shrink-0",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className,
        )}
        style={[{backgroundColor: colors.border}, style]}
        {...props}
      />
    );
  },
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export {Separator};
