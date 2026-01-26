import * as React from "react"
import { Linking, Platform, View } from "react-native"
import List, { ListHeader } from "@/components/ui/list"
import ListItem from "@/components/ui/list-item"
import { Muted } from "@/components/ui/typography"
import { ScrollView } from "react-native-gesture-handler"
import { BookOpen, Send, Shield, Star } from "@/lib/icons"
import * as WebBrowser from "expo-web-browser"

import { ThemeSettingItem } from "@/components/settings/ThemeItem"
import { NotificationItem } from "@/components/settings/NotificationItem"
import { AudioSettingItem } from "@/components/settings/AudioSettingItem"
import { VoiceActorSettingItem } from "@/components/settings/VoiceActorSettingItem"
import { LessonSettingsItem } from "@/components/settings/LessonSettingsItem"
import { ReviewSettingsItem } from "@/components/settings/ReviewSettingsItem"
import { CacheSettingsItem } from "@/components/settings/CacheSettingsItem"
import { LogoutItem } from "@/components/settings/LogoutItem"

export default function Settings() {
  const openExternalURL = (url: string) => {
    if (Platform.OS === "web") {
      Linking.openURL(url)
    } else {
      WebBrowser.openBrowserAsync(url)
    }
  }

  return (
    <ScrollView className="flex-1 w-full px-6 bg-background pt-4 gap-y-6">
      <List>
        {/* Appearance */}
        <ListHeader>
          <Muted>APPEARANCE</Muted>
        </ListHeader>
        <ThemeSettingItem />

        {/* Study Settings */}
        <ListHeader className="pt-8">
          <Muted>STUDY</Muted>
        </ListHeader>
        <LessonSettingsItem />
        <ReviewSettingsItem />

        {/* Audio Settings (Native only) */}
        {Platform.OS !== "web" && (
          <>
            <ListHeader className="pt-8">
              <Muted>AUDIO</Muted>
            </ListHeader>
            <AudioSettingItem />
            <VoiceActorSettingItem />
          </>
        )}

        {/* Notifications (Native only) */}
        {Platform.OS !== "web" && (
          <>
            <ListHeader className="pt-8">
              <Muted>NOTIFICATIONS</Muted>
            </ListHeader>
            <NotificationItem />
          </>
        )}

        {/* Storage */}
        {Platform.OS !== "web" && (
          <>
            <ListHeader className="pt-8">
              <Muted>STORAGE</Muted>
            </ListHeader>
            <CacheSettingsItem />
          </>
        )}

        {/* About */}
        <ListHeader className="pt-8">
          <Muted>ABOUT</Muted>
        </ListHeader>
        <ListItem
          itemLeft={(props) => <Star {...props} />}
          label="Give us a star"
          onPress={() =>
            openExternalURL("https://github.com/YannickHerrero/kanidachi")
          }
        />
        <ListItem
          itemLeft={(props) => <Send {...props} />}
          label="Send Feedback"
          onPress={() =>
            openExternalURL("https://github.com/YannickHerrero/kanidachi/issues")
          }
        />
        <ListItem
          itemLeft={(props) => <Shield {...props} />}
          label="Privacy Policy"
          onPress={() =>
            openExternalURL("https://github.com/YannickHerrero/kanidachi")
          }
        />
        <ListItem
          itemLeft={(props) => <BookOpen {...props} />}
          label="Terms of service"
          onPress={() =>
            openExternalURL("https://github.com/YannickHerrero/kanidachi")
          }
        />

        {/* Account */}
        <ListHeader className="pt-8">
          <Muted>ACCOUNT</Muted>
        </ListHeader>
        <LogoutItem />

        {/* Bottom spacing */}
        <View className="h-8" />
      </List>
    </ScrollView>
  )
}
