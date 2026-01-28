import * as React from "react"
import { View, Pressable, ScrollView } from "react-native"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import { useThemeColors } from "@/hooks/useThemeColors"

export type SubjectTypeFilter = "all" | "radical" | "kanji" | "vocabulary"

interface TypeFilterProps {
  selectedFilter: SubjectTypeFilter
  onFilterChange: (filter: SubjectTypeFilter) => void
  counts?: {
    all: number
    radical: number
    kanji: number
    vocabulary: number
  }
  showCounts?: boolean
}

const FILTERS: Array<{ key: SubjectTypeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "radical", label: "Radicals" },
  { key: "kanji", label: "Kanji" },
  { key: "vocabulary", label: "Vocab" },
]

export function TypeFilter({
  selectedFilter,
  onFilterChange,
  counts,
  showCounts = true,
}: TypeFilterProps) {
  const colors = useThemeColors()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-2 gap-2"
      style={{ backgroundColor: colors.muted + '4D' }}
    >
      {FILTERS.map((filter) => {
        const count = counts?.[filter.key] ?? 0
        const isSelected = selectedFilter === filter.key

        return (
          <Pressable
            key={filter.key}
            onPress={() => onFilterChange(filter.key)}
            className="px-3 py-1.5 rounded-full"
            style={{ backgroundColor: isSelected ? colors.primary : colors.muted }}
          >
            <Text
              className={cn("text-sm", isSelected && "font-medium")}
              style={{ color: isSelected ? colors.primaryForeground : colors.mutedForeground }}
            >
              {filter.label}
              {showCounts && counts ? ` (${count})` : ""}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
