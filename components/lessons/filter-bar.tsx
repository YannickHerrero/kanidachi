import * as React from "react"
import { View, Pressable, StyleSheet } from "react-native"

import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"
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

// Note: Using inline styles instead of NativeWind className on Pressable to avoid
// NativeWind v4 CSS interop race condition that breaks React Navigation context
// https://github.com/nativewind/nativewind/discussions/1537
export function FilterBar({ selectedFilter, onFilterChange, counts }: FilterBarProps) {
  const colors = useThemeColors()
  const isDark = colors.background === '#0a0a0b'

  const containerBg = isDark ? "rgba(30, 30, 35, 0.5)" : "rgba(240, 240, 245, 0.5)"

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      {FILTERS.map((filter) => {
        const count = counts[filter.key]
        const isSelected = selectedFilter === filter.key

        return (
          <Pressable
            key={filter.key}
            onPress={() => onFilterChange(filter.key)}
            style={[
              styles.filterButton,
              { backgroundColor: isSelected ? colors.primary : colors.muted },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: isSelected ? colors.primaryForeground : colors.mutedForeground,
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
