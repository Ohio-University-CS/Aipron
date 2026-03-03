"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { RecipeHeader } from "./components/RecipeHeader";
import { IngredientsList } from "./components/IngredientsList";
import { CookingSteps } from "./components/CookingSteps";
import { AIAssistant } from "./components/AIAssistant";
import { CookingTimer } from "./components/CookingTimer";

const recipe = {
  title: "Classic Spaghetti Carbonara",
  image:
    "https://images.unsplash.com/photo-1633253037289-b1cec78fd209?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  prepTime: "10 min",
  cookTime: "15 min",
  servings: 4,
  ingredients: [
    { id: "1", name: "Spaghetti pasta", amount: "400g" },
    { id: "2", name: "Pancetta or guanciale, diced", amount: "200g" },
    { id: "3", name: "Large eggs", amount: "4" },
    { id: "4", name: "Pecorino Romano cheese, grated", amount: "100g" },
    { id: "5", name: "Black pepper, freshly ground", amount: "2 tsp" },
    { id: "6", name: "Salt for pasta water", amount: "to taste" },
    { id: "7", name: "Extra virgin olive oil", amount: "1 tbsp" },
  ],
  steps: [
    {
      id: 1,
      instruction:
        "Bring a large pot of salted water to a boil. Add the spaghetti and cook until al dente.",
      duration: "10-12 min",
    },
    {
      id: 2,
      instruction:
        "Heat olive oil in a large pan over medium heat. Add the diced pancetta and cook until crispy and golden brown.",
      duration: "5-7 min",
    },
    {
      id: 3,
      instruction:
        "In a bowl, whisk together the eggs, grated Pecorino Romano, and plenty of freshly ground black pepper.",
    },
    {
      id: 4,
      instruction:
        "Reserve 1 cup of pasta cooking water, then drain the spaghetti. Add the hot pasta to the pan with the pancetta.",
      duration: "1 min",
    },
    {
      id: 5,
      instruction:
        "Remove from heat. Quickly pour the egg mixture over the pasta, tossing continuously. Add reserved pasta water a little at a time to create a creamy sauce.",
      duration: "2-3 min",
    },
    {
      id: 6,
      instruction:
        "Serve immediately with extra Pecorino Romano and black pepper on top. Enjoy your perfect carbonara!",
    },
  ],
};

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      {/* Mobile Device Frame */}
      <div className="relative h-[844px] w-[390px] overflow-hidden rounded-[3rem] border-8 border-slate-800 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 shadow-2xl">
        {/* Status bar notch */}
        <div className="absolute left-1/2 top-0 z-20 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-slate-800" />

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 pb-4 pt-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-100">
                AI Cooking Assistant
              </p>
              <h1 className="text-xl font-bold text-white">Today&apos;s Recipe</h1>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <span className="text-2xl">🍳</span>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="h-[calc(100%-120px)] space-y-4 overflow-y-auto px-4 pb-20 pt-3">
          <RecipeHeader
            title={recipe.title}
            image={recipe.image}
            prepTime={recipe.prepTime}
            cookTime={recipe.cookTime}
            servings={recipe.servings}
          />
          <CookingTimer />
          <IngredientsList ingredients={recipe.ingredients} />
          <CookingSteps steps={recipe.steps} />
        </div>

        {/* AI Chat Overlay */}
        {isChatOpen && (
          <div className="absolute inset-x-0 bottom-0 z-10 h-[calc(100%-80px)] bg-transparent px-4 pb-16">
            <AIAssistant onClose={() => setIsChatOpen(false)} />
          </div>
        )}

        {/* Bottom nav / FAB */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-around border-t border-gray-100 bg-white px-6">
          <button
            type="button"
            className="flex flex-col items-center gap-0.5 text-orange-500"
          >
            <span className="text-lg">🏠</span>
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-0.5 text-gray-400"
          >
            <span className="text-lg">🔍</span>
            <span className="text-[10px]">Search</span>
          </button>
          <button
            type="button"
            onClick={() => setIsChatOpen((open) => !open)}
            className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 shadow-lg transition-colors hover:bg-orange-600"
          >
            <Bot className="h-5 w-5 text-white" />
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-0.5 text-gray-400"
          >
            <span className="text-lg">❤️</span>
            <span className="text-[10px]">Saved</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-0.5 text-gray-400"
          >
            <span className="text-lg">👤</span>
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </div>
    </main>
  );
}
