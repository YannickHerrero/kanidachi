import {Pressable, View} from "react-native";

import {H4} from '@/components/ui/typography';
import {BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetOpenTrigger, BottomSheetView} from "@/components/primitives/bottomSheet/bottom-sheet.native";
import {Text} from "@/components/ui//text";
import {Moon, Palette, Smartphone, Sun} from '@/lib/icons';

import ListItem from "@/components/ui/list-item";
import {Check} from "@/lib/icons/Check";
import {useCallback, useMemo} from "react";
import {useBottomSheetModal} from "@gorhom/bottom-sheet";
import {useThemeStore, ThemePreference} from "@/stores/theme";
import {useThemeColors} from "@/hooks/useThemeColors";

type ItemData = {
  title: string;
  subtitle: string;
  value: ThemePreference;
  icon: React.ReactNode;
};

type ItemProps = {
  item: ItemData;
  onPress: () => void;
  selected: boolean;
};

function ThemeItem({item, onPress, selected}: ItemProps) {
  const colors = useThemeColors();
  return (
    <Pressable className="py-4" onPress={onPress}>
      <View className="flex bg-pink flex-row justify-between">
        <View className="pr-4 pt-1">{item.icon}</View>
        <View className="flex-1">
          <H4>{item.title}</H4>
          <Text className="text-sm" style={{color: colors.mutedForeground}}>{item.subtitle}</Text>
        </View>
        <View>{selected && <Check color={colors.accentForeground} />}</View>
      </View>
    </Pressable>
  );
}

export const ThemeSettingItem = () => {
  const themeMode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const colors = useThemeColors();

  const {dismiss} = useBottomSheetModal();

  const themes: ItemData[] = useMemo(
    () => [
      {
        title: "Device settings",
        subtitle: "Default to your device's appearance",
        value: "system",
        icon: <Smartphone color={colors.foreground} />,
      },
      {
        title: "Dark mode",
        subtitle: "Always use Dark mode",
        value: "dark",
        icon: <Moon color={colors.foreground} />,
      },
      {
        title: "Light mode",
        subtitle: "Always use Light mode",
        value: "light",
        icon: <Sun color={colors.foreground} />,
      },
    ],
    [colors.foreground],
  );

  const onSelect = useCallback(
    (value: ThemePreference) => {
      setMode(value);
      dismiss();
    }, [setMode, dismiss]
  );

  return (
    <BottomSheet >
      <BottomSheetOpenTrigger asChild>
        <ListItem
          itemLeft={(props) => <Palette {...props} />} // props adds size and color attributes
          label="Theme"

        />
      </BottomSheetOpenTrigger>
      <BottomSheetContent>
        <BottomSheetHeader style={{backgroundColor: colors.background}}>
          <Text className="text-xl font-bold pb-1">
            Select Theme
          </Text>
        </BottomSheetHeader>
        <BottomSheetView className='gap-5 pt-6' style={{backgroundColor: colors.background}}>
          {themes.map((theme) => (
            <ThemeItem
              key={theme.title}
              item={theme}
              onPress={() => onSelect(theme.value)}
              selected={theme.value === themeMode}
            />
          ))}
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  );
};
