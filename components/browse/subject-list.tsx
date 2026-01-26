import * as React from "react"
import { View } from "react-native"
import { FlashList } from "@shopify/flash-list"
import { useRouter } from "expo-router"

import { Text } from "@/components/ui/text"
import { SubjectCell } from "./subject-cell"
import type { SubjectWithAssignment, GroupedSubjects } from "@/hooks/useSubjectsByLevel"

interface SectionHeader {
  type: "header"
  title: string
  count: number
}

interface SectionItem {
  type: "item"
  data: SubjectWithAssignment
}

type ListItem = SectionHeader | SectionItem

interface SubjectListProps {
  grouped: GroupedSubjects
  showSrsStage?: boolean
}

export function SubjectList({ grouped, showSrsStage = true }: SubjectListProps) {
  const router = useRouter()

  // Flatten grouped data into a list with section headers
  const data = React.useMemo<ListItem[]>(() => {
    const items: ListItem[] = []

    // Radicals section
    if (grouped.radicals.length > 0) {
      items.push({ type: "header", title: "Radicals", count: grouped.radicals.length })
      grouped.radicals.forEach((item) => {
        items.push({ type: "item", data: item })
      })
    }

    // Kanji section
    if (grouped.kanji.length > 0) {
      items.push({ type: "header", title: "Kanji", count: grouped.kanji.length })
      grouped.kanji.forEach((item) => {
        items.push({ type: "item", data: item })
      })
    }

    // Vocabulary section
    if (grouped.vocabulary.length > 0) {
      items.push({ type: "header", title: "Vocabulary", count: grouped.vocabulary.length })
      grouped.vocabulary.forEach((item) => {
        items.push({ type: "item", data: item })
      })
    }

    return items
  }, [grouped])

  const handleSubjectPress = (subjectId: number) => {
    router.push(`/subject/${subjectId}`)
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "header") {
      return (
        <View className="px-4 py-3 bg-muted/50 border-b border-border">
          <Text className="text-sm font-semibold text-muted-foreground">
            {item.title} ({item.count})
          </Text>
        </View>
      )
    }

    return (
      <SubjectCell
        subject={item.data.subject}
        assignment={item.data.assignment}
        onPress={() => handleSubjectPress(item.data.subject.id)}
        showSrsStage={showSrsStage}
      />
    )
  }

  const getItemType = (item: ListItem) => {
    return item.type
  }

  if (data.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-muted-foreground text-center">
          No subjects found for this level
        </Text>
      </View>
    )
  }

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      getItemType={getItemType}
      keyExtractor={(item, index) =>
        item.type === "header" ? `header-${item.title}` : `item-${item.data.subject.id}`
      }
    />
  )
}
