import { Redirect } from "expo-router";

// Redirect to tabs so Chat, Pantry, Recipes, Profile are all accessible.
export default function Index() {
  return <Redirect href="/(tabs)/chat" />;
}
