import { Platform, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

const rootStyle = StyleSheet.create({
  flex: { flex: 1 },
  webRoot: {
    flex: 1,
    minHeight: "100vh" as unknown as number,
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView
      style={Platform.OS === "web" ? rootStyle.webRoot : rootStyle.flex}
    >
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="cooking/[id]" options={{ presentation: "fullScreenModal" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
