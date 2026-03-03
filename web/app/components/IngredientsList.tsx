import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

interface IngredientsListProps {
  ingredients: Ingredient[];
}

export function IngredientsList({ ingredients }: IngredientsListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleIngredient = (id: string) => {
    const next = new Set(checkedItems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCheckedItems(next);
  };

  return (
    <div className="rounded-xl border-2 border-orange-100 bg-white p-4 shadow-lg">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
        <span className="h-6 w-1.5 rounded-full bg-orange-500" />
        Ingredients
      </h2>
      <div className="space-y-2">
        {ingredients.map((ingredient) => {
          const isChecked = checkedItems.has(ingredient.id);
          return (
            <button
              key={ingredient.id}
              type="button"
              onClick={() => toggleIngredient(ingredient.id)}
              className="flex w-full items-center gap-2.5 rounded-lg p-2.5 text-left transition-colors hover:bg-orange-50"
            >
              {isChecked ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-orange-500" />
              ) : (
                <Circle className="h-5 w-5 flex-shrink-0 text-gray-300" />
              )}
              <div className="min-w-0 flex-1">
                <span
                  className={`text-sm ${
                    isChecked ? "line-through text-gray-400" : "text-gray-900"
                  }`}
                >
                  {ingredient.name}
                </span>
              </div>
              <span
                className={`flex-shrink-0 text-xs ${
                  isChecked
                    ? "text-gray-400"
                    : "font-semibold text-orange-600"
                }`}
              >
                {ingredient.amount}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 border-t border-orange-100 pt-3">
        <div className="text-xs text-gray-600">
          {checkedItems.size} of {ingredients.length} ingredients gathered
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-orange-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-300"
            style={{
              width: `${(checkedItems.size / ingredients.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

