import "./global.css";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PortalHost } from "@/components/primitives/portal";
import { DatabaseProvider, useDatabase } from "@/db/provider";
import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { DARK_THEME, LIGHT_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { getItem, setItem } from "@/lib/storage";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { initializeBackgroundSync, stopBackgroundSync } from "@/lib/sync/background-sync";
import {
  configureNotificationHandler,
  configureAndroidNotificationChannel,
} from "@/lib/notifications";
import { useReviewNotifications } from "@/hooks/useReviewNotifications";


export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before getting the color scheme.
SplashScreen.preventAutoHideAsync();

// Component to initialize background sync after database is ready
function BackgroundSyncInitializer() {
  const { db } = useDatabase();
  const { status } = useAuthStore();

  useEffect(() => {
    if (db && status === "authenticated") {
      initializeBackgroundSync(db);
    }

    return () => {
      stopBackgroundSync();
    };
  }, [db, status]);

  return null;
}

// Component to manage notification badge and scheduling
function NotificationManager() {
  // This hook handles badge updates and notification scheduling
  useReviewNotifications();
  return null;
}

// Initialize notification handler on app start (before rendering)
if (Platform.OS !== "web") {
  configureNotificationHandler();
  configureAndroidNotificationChannel();
}

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { status, initialize } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useFrameworkReady();

  // Initialize auth state on app launch
  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const theme = getItem("theme");
    if (!theme) {
      setAndroidNavigationBar(colorScheme);
      setItem("theme", colorScheme);
      return;
    }
    const colorTheme = theme === "dark" ? "dark" : "light";
    setAndroidNavigationBar(colorTheme);
    if (colorTheme !== colorScheme) {
      setColorScheme(colorTheme);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Auth-based routing
  useEffect(() => {
    if (status === "loading") return;

    const inAuthGroup = segments[0] === "login";

    if (status === "unauthenticated" && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/login");
    } else if (status === "authenticated" && inAuthGroup) {
      // Redirect to home if already authenticated and on login screen
      router.replace("/");
    }
  }, [status, segments]);


  return (
    <DatabaseProvider>
      <ThemeProvider value={colorScheme === "dark" ? DARK_THEME : LIGHT_THEME}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <Stack>
              <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
              <Stack.Screen name="login" options={{ title: "Login", headerShown: false }} />
              <Stack.Screen name="sync" options={{ title: "Syncing", headerShown: false }} />
              <Stack.Screen name="settings" options={{ title: "Settings", headerShadowVisible: false }} />
              <Stack.Screen name="lessons/index" options={{ headerShown: false }} />
              <Stack.Screen name="lessons/content" options={{ headerShown: false }} />
              <Stack.Screen name="lessons/quiz" options={{ headerShown: false }} />
              <Stack.Screen name="reviews/index" options={{ headerShown: false }} />
              <Stack.Screen name="reviews/summary" options={{ headerShown: false }} />
              <Stack.Screen name="browse/index" options={{ headerShown: false }} />
              <Stack.Screen name="browse/level/[level]" options={{ headerShown: false }} />
              <Stack.Screen name="browse/search" options={{ headerShown: false }} />
              <Stack.Screen name="subject/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="stats" options={{ headerShown: false }} />
            </Stack>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
      <PortalHost />
      <BackgroundSyncInitializer />
      {Platform.OS !== "web" && <NotificationManager />}
    </DatabaseProvider>
  );
}
