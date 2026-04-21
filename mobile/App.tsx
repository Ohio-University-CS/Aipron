import React from "react";
import { GestureRootView } from "./src/components/GestureRootView";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ChatScreen from "./app/(tabs)/chat";

// Simple entry that renders the Chat UI directly,
// bypassing routing/auth so you can see the interface.
export default function App() {
  return (
    <GestureRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ChatScreen />
      </SafeAreaProvider>
    </GestureRootView>
  );
}


