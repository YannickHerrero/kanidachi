import type {
  BottomSheetBackdropProps,
  BottomSheetFooterProps as GBottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList as GBottomSheetFlatList,
  BottomSheetFooter as GBottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput as GBottomSheetTextInput,
  BottomSheetView as GBottomSheetView,
  useBottomSheetModal,
} from "@gorhom/bottom-sheet";
import type {BottomSheetModalMethods} from "@gorhom/bottom-sheet/lib/typescript/types";
import * as React from "react";
import {
  type GestureResponderEvent,
  Keyboard,
  Pressable,
  View,
  type ViewStyle,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {X} from "../../components/Icons";
import {cn} from "../../lib/utils";
import {useThemeColors} from "@/hooks/useThemeColors";
import * as Slot from "../primitives/slot";
import {Button} from "./button";

// TODO: refactor and move to UI
// TODO: create web component, use https://ui.shadcn.com/docs/components/drawer

type BottomSheetRef = React.ElementRef<typeof View>;
type BottomSheetProps = React.ComponentPropsWithoutRef<typeof View>;

interface BottomSheetContext {
  sheetRef: React.RefObject<BottomSheetModal>;
}

const BottomSheetContext = React.createContext({} as BottomSheetContext);

const BottomSheet = React.forwardRef<BottomSheetRef, BottomSheetProps>(
  ({...props}, ref) => {
    const sheetRef = React.useRef<BottomSheetModal>(null);

    return (
      <BottomSheetContext.Provider value={{sheetRef: sheetRef}}>
        <View ref={ref} {...props} />
      </BottomSheetContext.Provider>
    );
  },
);

function useBottomSheetContext() {
  const context = React.useContext(BottomSheetContext);
  if (!context) {
    throw new Error(
      "BottomSheet compound components cannot be rendered outside the BottomSheet component",
    );
  }
  return context;
}

const CLOSED_INDEX = -1;

type BottomSheetContentRef = React.ElementRef<typeof BottomSheetModal>;

type BottomSheetContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof BottomSheetModal>,
  "backdropComponent"
> & {
  backdropProps?: Partial<
    React.ComponentPropsWithoutRef<typeof BottomSheetBackdrop>
  >;
};

const BottomSheetContent = React.forwardRef<
  BottomSheetContentRef,
  BottomSheetContentProps
>(
  (
    {
      enablePanDownToClose = true,
      enableDynamicSizing = true,
      index = 0,
      backdropProps,
      backgroundStyle,
      android_keyboardInputMode = "adjustResize",
      ...props
    },
    ref,
  ) => {
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();
    const {sheetRef} = useBottomSheetContext();

    React.useImperativeHandle(
      ref,
      () => {
        if (!sheetRef.current) {
          return {} as BottomSheetModalMethods;
        }
        return sheetRef.current;
      },
      [sheetRef.current],
    );

    const renderBackdrop = React.useCallback(
      (props: BottomSheetBackdropProps) => {
        const {
          pressBehavior = "close",
          opacity = 0.5,
          disappearsOnIndex = CLOSED_INDEX,
          style,
          onPress,
          ...rest
        } = {
          ...props,
          ...backdropProps,
        };
        return (
          <BottomSheetBackdrop
            opacity={opacity}
            disappearsOnIndex={disappearsOnIndex}
            pressBehavior={pressBehavior}
            style={[{backgroundColor: "rgba(0,0,0,0.8)"}, style]}
            onPress={() => {
              if (Keyboard.isVisible()) {
                Keyboard.dismiss();
              }
              onPress?.();
            }}
            {...rest}
          />
        );
      },
      [backdropProps],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        enableDynamicSizing={enableDynamicSizing}
        backgroundStyle={[{backgroundColor: colors.card}, backgroundStyle]}
        handleIndicatorStyle={{
          backgroundColor: colors.foreground,
        }}
        topInset={insets.top}
        android_keyboardInputMode={android_keyboardInputMode}
        {...props}
      />
    );
  },
);

const BottomSheetOpenTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  React.ComponentPropsWithoutRef<typeof Pressable> & {
    asChild?: boolean;
  }
>(({onPress, asChild = false, ...props}, ref) => {
  const {sheetRef} = useBottomSheetContext();
  function handleOnPress(ev: GestureResponderEvent) {
    sheetRef.current?.present();
    onPress?.(ev);
  }
  const Trigger = asChild ? Slot.Pressable : Pressable;
  return <Trigger ref={ref} onPress={handleOnPress} {...props} />;
});

const BottomSheetCloseTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  React.ComponentPropsWithoutRef<typeof Pressable> & {
    asChild?: boolean;
  }
>(({onPress, asChild = false, ...props}, ref) => {
  const {dismiss} = useBottomSheetModal();
  function handleOnPress(ev: GestureResponderEvent) {
    dismiss();
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }
    onPress?.(ev);
  }
  const Trigger = asChild ? Slot.Pressable : Pressable;
  return <Trigger ref={ref} onPress={handleOnPress} {...props} />;
});

const BOTTOM_SHEET_HEADER_HEIGHT = 60; // BottomSheetHeader height

type BottomSheetViewProps = Omit<
  React.ComponentPropsWithoutRef<typeof GBottomSheetView>,
  "style"
> & {
  hadHeader?: boolean;
  style?: ViewStyle;
};

function BottomSheetView({
  className,
  children,
  hadHeader = true,
  style,
  ...props
}: BottomSheetViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <GBottomSheetView
      style={[
        {
          paddingBottom:
            insets.bottom + (hadHeader ? BOTTOM_SHEET_HEADER_HEIGHT : 0),
        },
        style,
      ]}
      className={cn(`px-4`, className)}
      {...props}
    >
      {children}
    </GBottomSheetView>
  );
}

type BottomSheetTextInputRef = React.ElementRef<typeof GBottomSheetTextInput>;
type BottomSheetTextInputProps = React.ComponentPropsWithoutRef<
  typeof GBottomSheetTextInput
>;
const BottomSheetTextInput = React.forwardRef<
  BottomSheetTextInputRef,
  BottomSheetTextInputProps
>(({className, placeholderClassName, style, ...props}, ref) => {
  const colors = useThemeColors();
  return (
    <GBottomSheetTextInput
      ref={ref}
      className={cn(
        "rounded-md border px-3 text-xl h-14 leading-[1.25] items-center disabled:opacity-50",
        className,
      )}
      style={[
        {
          borderColor: colors.input,
          backgroundColor: colors.background,
          color: colors.foreground,
        },
        style,
      ]}
      placeholderTextColor={colors.mutedForeground}
      placeholderClassName={cn(placeholderClassName)}
      {...props}
    />
  );
});

type BottomSheetFlatListRef = React.ElementRef<typeof GBottomSheetFlatList>;
type BottomSheetFlatListProps = React.ComponentPropsWithoutRef<
  typeof GBottomSheetFlatList
>;
const BottomSheetFlatList = React.forwardRef<
  BottomSheetFlatListRef,
  BottomSheetFlatListProps
>(({className, ...props}, ref) => {
  const insets = useSafeAreaInsets();
  return (
    <GBottomSheetFlatList
      ref={ref}
      contentContainerStyle={[{paddingBottom: insets.bottom}]}
      className={cn("py-4", className)}
      keyboardShouldPersistTaps="handled"
      {...props}
    />
  );
});

type BottomSheetHeaderRef = React.ElementRef<typeof View>;
type BottomSheetHeaderProps = React.ComponentPropsWithoutRef<typeof View>;
const BottomSheetHeader = React.forwardRef<
  BottomSheetHeaderRef,
  BottomSheetHeaderProps
>(({className, children, style, ...props}, ref) => {
  const {dismiss} = useBottomSheetModal();
  const colors = useThemeColors();
  function close() {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }
    dismiss();
  }
  return (
    <View
      ref={ref}
      className={cn(
        "border-b flex-row items-center justify-between pl-4",
        className,
      )}
      style={[{borderColor: colors.border}, style]}
      {...props}
    >
      {children}
      <Button onPress={close} variant="ghost" className="pr-4">
        <X color={colors.mutedForeground} size={24} />
      </Button>
    </View>
  );
});

type BottomSheetFooterRef = React.ElementRef<typeof View>;
type BottomSheetFooterProps = Omit<
  React.ComponentPropsWithoutRef<typeof View>,
  "style"
> & {
  bottomSheetFooterProps: GBottomSheetFooterProps;
  children?: React.ReactNode;
  style?: ViewStyle;
};

/**
 * To be used in a useCallback function as a props to BottomSheetContent
 */
const BottomSheetFooter = React.forwardRef<
  BottomSheetFooterRef,
  BottomSheetFooterProps
>(({bottomSheetFooterProps, children, className, style, ...props}, ref) => {
  const insets = useSafeAreaInsets();
  return (
    <GBottomSheetFooter {...bottomSheetFooterProps}>
      <View
        ref={ref}
        style={[{paddingBottom: insets.bottom + 6}, style]}
        className={cn("px-4 pt-1.5", className)}
        {...props}
      >
        {children}
      </View>
    </GBottomSheetFooter>
  );
});

function useBottomSheet() {
  const ref = React.useRef<BottomSheetContentRef>(null);

  const open = React.useCallback(() => {
    ref.current?.present();
  }, []);

  const close = React.useCallback(() => {
    ref.current?.dismiss();
  }, []);

  return {ref, open, close};
}

export {
  BottomSheet,
  BottomSheetCloseTrigger,
  BottomSheetContent,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetOpenTrigger,
  BottomSheetTextInput,
  BottomSheetView,
  useBottomSheet,
};
