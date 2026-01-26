import * as React from "react"
import { TextInput, View, Pressable } from "react-native"
import { Search, X } from "lucide-react-native"

import { cn } from "@/lib/utils"
import { useColorScheme } from "@/lib/useColorScheme"

interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  onClear?: () => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = "Search...",
  autoFocus = false,
  className,
}: SearchBarProps) {
  const { colorScheme } = useColorScheme()
  const inputRef = React.useRef<TextInput>(null)

  const handleClear = () => {
    onChangeText("")
    onClear?.()
    inputRef.current?.focus()
  }

  const iconColor = colorScheme === "dark" ? "#a1a1aa" : "#71717a"

  return (
    <View
      className={cn(
        "flex-row items-center bg-muted rounded-lg px-3 py-2",
        className
      )}
    >
      <Search size={20} color={iconColor} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={iconColor}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 ml-2 text-base text-foreground"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8}>
          <X size={20} color={iconColor} />
        </Pressable>
      )}
    </View>
  )
}
