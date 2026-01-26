import * as React from "react"
import { View, Pressable, StyleSheet } from "react-native"

import { Text } from "@/components/ui/text"
import { useColorScheme } from "@/lib/useColorScheme"
import type { SubjectTypeFilter } from "@/hooks/useAvailableLessons"

interface FilterBarProps {
  selectedFilter: SubjectTypeFilter
  onFilterChange: (filter: SubjectTypeFilter) => void
  counts: {
    all: number
    radical: number
    kanji: number
    vocabulary: number
  }
}

const FILTERS: Array<{ key: SubjectTypeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "radical", label: "Radicals" },
  { key: "kanji", label: "Kanji" },
  { key: "vocabulary", label: "Vocab" },
]

// Theme colors
const COLORS = {
  light: {
    containerBg: "rgba(240, 240, 245, 0.5)", // muted/50
    selectedBg: "hsl(240, 5.9%, 10%)", // primary
    unselectedBg: "hsl(240, 4.8%, 95.9%)", // muted
    selectedText: "hsl(0, 0%, 98%)", // primary-foreground
    unselectedText: "hsl(240, 3.8%, 46.1%)", // muted-foreground
  },
  dark: {
    containerBg: "rgba(30, 30, 35, 0.5)", // muted/50 dark
    selectedBg: "hsl(0, 0%, 98%)", // primary dark
    unselectedBg: "hsl(240, 3.7%, 15.9%)", // muted dark
    selectedText: "hsl(240, 5.9%, 10%)", // primary-foreground dark
    unselectedText: "hsl(240, 5%, 64.9%)", // muted-foreground dark
  },
}

// Note: Using inline styles instead of NativeWind className on Pressable to avoid
// NativeWind v4 CSS interop race condition that breaks React Navigation context
// https://github.com/nativewind/nativewind/discussions/1537
export function FilterBar({ selectedFilter, onFilterChange, counts }: FilterBarProps) {
  const { colorScheme } = useColorScheme()
  const colors = COLORS[colorScheme ?? "light"]

  return (
    <View style={[styles.container, { backgroundColor: colors.containerBg }]}>
      {FILTERS.map((filter) => {
        const count = counts[filter.key]
        const isSelected = selectedFilter === filter.key

        return (
          <Pressable
            key={filter.key}
            onPress={() => onFilterChange(filter.key)}
            style={[
              styles.filterButton,
              { backgroundColor: isSelected ? colors.selectedBg : colors.unselectedBg },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { 
                  color: isSelected ? colors.selectedText : colors.unselectedText,
                  fontWeight: isSelected ? "500" : "400",
                },
              ]}
            >
              {filter.label} ({count})
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999, // rounded-full
  },
  filterText: {
    fontSize: 14,
  },
})
