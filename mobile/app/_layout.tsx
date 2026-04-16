import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/store/useAuthStore";
import {
  NotoSerif_400Regular,
  NotoSerif_400Regular_Italic,
  NotoSerif_700Bold,
  NotoSerif_700Bold_Italic,
} from "@expo-google-fonts/noto-serif";
import {
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initialize();
    return unsubscribe;
  }, []);

  const [fontsLoaded] = useFonts({
    NotoSerif: NotoSerif_400Regular,
    "NotoSerif-Italic": NotoSerif_400Regular_Italic,
    "NotoSerif-Bold": NotoSerif_700Bold,
    "NotoSerif-BoldItalic": NotoSerif_700Bold_Italic,
    PlusJakartaSans: PlusJakartaSans_400Regular,
    "PlusJakartaSans-Light": PlusJakartaSans_300Light,
    "PlusJakartaSans-Medium": PlusJakartaSans_500Medium,
    "PlusJakartaSans-SemiBold": PlusJakartaSans_600SemiBold,
    "PlusJakartaSans-Bold": PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="cooking/[id]" options={{ presentation: "fullScreenModal" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
