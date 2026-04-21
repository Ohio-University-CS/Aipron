import { useLocalSearchParams, useRouter } from "expo-router";
import { CookingSessionView } from "../../src/components/CookingSessionView";

export default function CookingModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  if (!id || typeof id !== "string") {
    return null;
  }

  return <CookingSessionView recipeId={id} onClose={() => router.back()} />;
}
