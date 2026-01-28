import {Pressable, View} from "react-native";
import {MoonStar, Sun} from "@/components/Icons";
import {cn} from "@/lib/utils";
import {useThemeStore} from "@/stores/theme";
import {useThemeColors} from "@/hooks/useThemeColors";

export function ThemeToggle() {
  const colors = useThemeColors();
  const isDark = colors.background === '#0a0a0b';
  const toggleMode = useThemeStore((s) => s.toggleMode);

  return (
    <Pressable
      onPress={() => toggleMode()}
      className="web:ring-offset-background web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2"
    >
      {({pressed}) => (
        <View
          className={cn(
            "flex-1 aspect-square pt-0.5 justify-center items-start web:px-5",
            pressed && "opacity-70",
          )}
        >
          {isDark ? (
            <MoonStar
              color={colors.foreground}
              size={23}
              strokeWidth={1.25}
            />
          ) : (
            <Sun color={colors.foreground} size={24} strokeWidth={1.25} />
          )}
        </View>
      )}
    </Pressable>
  );
}
