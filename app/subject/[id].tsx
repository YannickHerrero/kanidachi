import * as React from "react"
import { ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, useLocalSearchParams, Stack } from "expo-router"
import { ChevronLeft, GraduationCap } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Skeleton } from "@/components/ui/skeleton"
import { usePracticeStore } from "@/stores/practice"
import {
  SubjectHeader,
  SubjectDetailContent,
} from "@/components/subject"
import { useSubject } from "@/hooks/useSubject"
import { useThemeColors } from "@/hooks/useThemeColors"

export default function SubjectDetailScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const params = useLocalSearchParams<{ id: string }>()
  const subjectId = Number.parseInt(params.id ?? "0", 10)

  const {
    data,
    studyMaterial,
    componentSubjects,
    amalgamationSubjects,
    visuallySimilarSubjects,
    isLoading,
    error,
  } = useSubject(subjectId)

  const startPractice = usePracticeStore((s) => s.startSession)

  const handleBack = () => {
    router.back()
  }

  const handlePractice = () => {
    if (data) {
      startPractice([{ subject: data.subject, assignment: data.assignment }])
      router.push("/practice")
    }
  }

  const iconColor = colors.foreground

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1">
          {/* Header skeleton */}
          <Skeleton className="h-48 w-full" />
          {/* Content skeleton */}
          <View className="p-4 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center" style={{ color: colors.destructive }}>
            {error ?? "Subject not found"}
          </Text>
          <Button onPress={handleBack} className="mt-4">
            <Text>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  const { subject, assignment } = data

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Back button overlay */}
        <View className="absolute top-12 left-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onPress={handleBack}
            className="bg-black/20 rounded-full"
          >
            <ChevronLeft size={24} color="#fff" />
          </Button>
        </View>

        {/* Practice button overlay */}
        <View className="absolute top-12 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onPress={handlePractice}
            className="bg-black/20 rounded-full"
          >
            <GraduationCap size={24} color="#fff" />
          </Button>
        </View>

        {/* Subject header */}
        <SubjectHeader subject={subject} assignment={assignment} />

        <SubjectDetailContent
          subject={subject}
          studyMaterial={studyMaterial}
          componentSubjects={componentSubjects}
          amalgamationSubjects={amalgamationSubjects}
          visuallySimilarSubjects={visuallySimilarSubjects}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
