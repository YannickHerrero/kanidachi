import * as React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';
import {buttonTextVariants, buttonVariants} from '@/components/ui/button';
import * as AlertDialogPrimitive from '@/components/primitives/alert-dialog';
import {cn} from '@/lib/utils';
import {TextClassContext} from '@/components/ui/text';
import {useThemeColors} from '@/hooks/useThemeColors';

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlayWeb = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({className, ...props}, ref) => {
  const {open} = AlertDialogPrimitive.useRootContext();
  return (
    <AlertDialogPrimitive.Overlay
      style={StyleSheet.absoluteFill}
      className={cn(
        'z-50 bg-black/80 flex justify-center items-center p-2',
        open ? 'web:animate-in web:fade-in-0' : 'web:animate-out web:fade-out-0',
        className
      )}
      {...props}
      ref={ref}
    />
  );
});

AlertDialogOverlayWeb.displayName = 'AlertDialogOverlayWeb';

const AlertDialogOverlayNative = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({className, children, ...props}, ref) => {
  return (
    <AlertDialogPrimitive.Overlay
      style={StyleSheet.absoluteFill}
      className={cn('z-50 bg-black/80 flex justify-center items-center p-2', className)}
      {...props}
      ref={ref}
      asChild
    >
      <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
        {children}
      </Animated.View>
    </AlertDialogPrimitive.Overlay>
  );
});

AlertDialogOverlayNative.displayName = 'AlertDialogOverlayNative';

const AlertDialogOverlay = Platform.select({
  web: AlertDialogOverlayWeb,
  default: AlertDialogOverlayNative,
});

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & {portalHost?: string}
>(({className, portalHost, style, ...props}, ref) => {
  const {open} = AlertDialogPrimitive.useRootContext();
  const colors = useThemeColors();

  return (
    <AlertDialogPortal hostName={portalHost}>
      <AlertDialogOverlay>
        <AlertDialogPrimitive.Content
          ref={ref}
          className={cn(
            'z-50 max-w-lg gap-4 border p-6 shadow-lg shadow-foreground/10 web:duration-200 rounded-lg',
            open
              ? 'web:animate-in web:fade-in-0 web:zoom-in-95'
              : 'web:animate-out web:fade-out-0 web:zoom-out-95',
            className
          )}
          style={[{backgroundColor: colors.background, borderColor: colors.border}, style]}
          {...props}
        />
      </AlertDialogOverlay>
    </AlertDialogPortal>
  );
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) => (
  <View className={cn('flex flex-col gap-2', className)} {...props} />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) => (
  <View
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2', className)}
    {...props}
  />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({className, style, ...props}, ref) => {
  const colors = useThemeColors();
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn('text-lg native:text-xl font-semibold', className)}
      style={[{color: colors.foreground}, style]}
      {...props}
    />
  );
});
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({className, style, ...props}, ref) => {
  const colors = useThemeColors();
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn('text-sm native:text-base', className)}
      style={[{color: colors.mutedForeground}, style]}
      {...props}
    />
  );
});
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({className, style, ...props}, ref) => {
  const colors = useThemeColors();
  return (
    <TextClassContext.Provider value={buttonTextVariants({className})}>
      <AlertDialogPrimitive.Action
        ref={ref}
        className={cn(buttonVariants(), className)}
        style={[{backgroundColor: colors.primary}, style]}
        {...props}
      />
    </TextClassContext.Provider>
  );
});
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({className, style, ...props}, ref) => {
  const colors = useThemeColors();
  return (
    <TextClassContext.Provider value={buttonTextVariants({className, variant: 'outline'})}>
      <AlertDialogPrimitive.Cancel
        ref={ref}
        className={cn(buttonVariants({variant: 'outline', className}))}
        style={[{backgroundColor: colors.background, borderColor: colors.input}, style]}
        {...props}
      />
    </TextClassContext.Provider>
  );
});
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
