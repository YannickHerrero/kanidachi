import * as React from "react"
import { View, Linking, Platform, KeyboardAvoidingView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import * as WebBrowser from "expo-web-browser"
import { useRouter } from "expo-router"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Text } from "@/components/ui/text"
import { H1, Muted } from "@/components/ui/typography"
import { useAuthStore } from "@/stores/auth"
import { isValidTokenFormat } from "@/lib/auth"

const WANIKANI_TOKENS_URL = "https://www.wanikani.com/settings/personal_access_tokens"

export default function Login() {
  const router = useRouter()
  const { login, isLoggingIn, error, clearError } = useAuthStore()
  const [token, setToken] = React.useState("")
  const [validationError, setValidationError] = React.useState<string | null>(null)

  const openWaniKaniTokensPage = () => {
    if (Platform.OS === "web") {
      Linking.openURL(WANIKANI_TOKENS_URL)
    } else {
      WebBrowser.openBrowserAsync(WANIKANI_TOKENS_URL)
    }
  }

  const handleTokenChange = (text: string) => {
    setToken(text)
    setValidationError(null)
    clearError()
  }

  const handleLogin = async () => {
    const trimmedToken = token.trim()

    // Validate token format
    if (!trimmedToken) {
      setValidationError("Please enter your API token")
      return
    }

    if (!isValidTokenFormat(trimmedToken)) {
      setValidationError("Invalid token format. WaniKani API tokens are 36-character UUIDs.")
      return
    }

    const success = await login(trimmedToken)

    if (success) {
      // Navigate to sync screen for initial data sync
      router.replace("/sync")
    }
  }

  const displayError = validationError || error

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="items-center mb-12">
            <H1 className="text-center mb-2">Welcome to Kanidachi</H1>
            <Muted className="text-center text-lg">
              Connect your WaniKani account to get started
            </Muted>
          </View>

          {/* Token Input */}
          <View className="gap-4 mb-6">
            <View>
              <Text className="text-sm font-medium mb-2">API Token</Text>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={token}
                onChangeText={handleTokenChange}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                editable={!isLoggingIn}
                secureTextEntry
              />
              {displayError && (
                <Text className="text-destructive text-sm mt-2">{displayError}</Text>
              )}
            </View>

            <Button onPress={handleLogin} disabled={isLoggingIn || !token.trim()}>
              <Text>{isLoggingIn ? "Connecting..." : "Connect Account"}</Text>
            </Button>
          </View>

          {/* Help Section */}
          <View className="items-center gap-4">
            <Muted className="text-center">
              Don't have an API token?
            </Muted>
            <Button variant="link" onPress={openWaniKaniTokensPage}>
              <Text className="text-primary">Get your token from WaniKani</Text>
            </Button>
          </View>

          {/* Info Section */}
          <View className="mt-12 px-4">
            <Muted className="text-center text-sm">
              Your API token is stored securely on your device and is only used to
              communicate with the WaniKani API.
            </Muted>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
