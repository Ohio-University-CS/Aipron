import { Tabs, Redirect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { shadows } from "../../src/constants/DesignTokens";
import { useAuthStore } from "../../src/store/useAuthStore";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authLoading = useAuthStore((state) => state.isLoading);
  const theme = useThemeColors();

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primaryContainer,
        tabBarInactiveTintColor: theme.onSurfaceVariant,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "PlusJakartaSans-Medium",
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
          backgroundColor: hexToRgba(theme.surface, 0.85),
          ...shadows.nav,
        },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons
              name={focused ? "chat-bubble" : "chat-bubble-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons
              name={focused ? "favorite" : "favorite-border"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
