import type {VariantProps} from "class-variance-authority";
import type {LucideIcon} from "lucide-react-native";
import * as React from "react";
import * as ToggleGroupPrimitive from "@/components/primitives/toggle-group";
import {TextClassContext} from "@/components/ui/text";
import {toggleTextVariants, toggleVariants} from "@/components/ui/toggle";
import {cn} from "@/lib/utils";
import {useThemeColors} from "@/hooks/useThemeColors";

const ToggleGroupContext = React.createContext<VariantProps<
  typeof toggleVariants
> | null>(null);

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>
>(({className, variant, size, children, ...props}, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-row items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{variant, size}}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

function useToggleGroupContext() {
  const context = React.useContext(ToggleGroupContext);
  if (context === null) {
    throw new Error(
      "ToggleGroup compound components cannot be rendered outside the ToggleGroup component",
    );
  }
  return context;
}

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>
>(({className, children, variant, size, style, ...props}, ref) => {
  const context = useToggleGroupContext();
  const {value} = ToggleGroupPrimitive.useRootContext();
  const colors = useThemeColors();
  const isSelected = ToggleGroupPrimitive.utils.getIsSelected(value, props.value);

  return (
    <TextClassContext.Provider
      value={cn(
        toggleTextVariants({variant, size}),
        isSelected
          ? "text-accent-foreground"
          : "web:group-hover:text-muted-foreground",
      )}
    >
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={cn(
          toggleVariants({
            variant: context.variant || variant,
            size: context.size || size,
          }),
          props.disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        style={[
          isSelected ? {backgroundColor: colors.accent} : undefined,
          style,
        ]}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Item>
    </TextClassContext.Provider>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

function ToggleGroupIcon({
  className,
  icon: Icon,
  ...props
}: React.ComponentPropsWithoutRef<LucideIcon> & {
  icon: LucideIcon;
}) {
  const textClass = React.useContext(TextClassContext);
  const colors = useThemeColors();
  return <Icon className={cn(textClass, className)} color={colors.foreground} {...props} />;
}

export {ToggleGroup, ToggleGroupIcon, ToggleGroupItem};
