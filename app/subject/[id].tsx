import * as React from "react"
import { ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, useLocalSearchParams, Stack } from "expo-router"
import { ChevronLeft } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SubjectHeader,
  Meanings,
  Readings,
  MeaningMnemonic,
  ReadingMnemonic,
  Components,
  Amalgamations,
  VisuallySimilar,
  Sentences,
  PartsOfSpeech,
  UserNotes,
} from "@/components/subject"
import { useSubject } from "@/hooks/useSubject"
import { useColorScheme } from "@/lib/useColorScheme"

export default function SubjectDetailScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
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

  const handleBack = () => {
    router.back()
  }

  const iconColor = colorScheme === "dark" ? "#fff" : "#000"

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
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
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-destructive text-center">
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
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
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

        {/* Subject header */}
        <SubjectHeader subject={subject} assignment={assignment} />

        {/* Content sections */}
        <View className="p-4 gap-4">
          {/* Meanings */}
          <Meanings subject={subject} studyMaterial={studyMaterial} />

          {/* Readings (kanji/vocab only) */}
          <Readings subject={subject} />

          {/* Parts of Speech (vocab only) */}
          <PartsOfSpeech subject={subject} />

          {/* Components (radicals/kanji used) */}
          <Components subject={subject} componentSubjects={componentSubjects} />

          {/* Meaning Mnemonic */}
          <MeaningMnemonic subject={subject} studyMaterial={studyMaterial} />

          {/* Reading Mnemonic (kanji/vocab only) */}
          <ReadingMnemonic subject={subject} studyMaterial={studyMaterial} />

          {/* Visually Similar Kanji (kanji only) */}
          <VisuallySimilar
            subject={subject}
            visuallySimilarSubjects={visuallySimilarSubjects}
          />

          {/* Used in... (amalgamations) */}
          <Amalgamations
            subject={subject}
            amalgamationSubjects={amalgamationSubjects}
          />

          {/* Context Sentences (vocab only) */}
          <Sentences subject={subject} />

          {/* User Notes */}
          <UserNotes studyMaterial={studyMaterial} />

          {/* Bottom padding */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
