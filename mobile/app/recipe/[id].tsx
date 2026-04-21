import { useLocalSearchParams, useRouter } from "expo-router";
import { RecipeDetailView } from "../../src/components/RecipeDetailView";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  if (!id || typeof id !== "string") {
    return null;
  }

  return (
    <RecipeDetailView
      recipeId={id}
      onBack={() => router.back()}
      onStartCooking={(recipeId) => router.push(`/cooking/${recipeId}` as never)}
    />
  );
}
