import { Clock, Users } from "lucide-react";

interface RecipeHeaderProps {
  title: string;
  image: string;
  prepTime: string;
  cookTime: string;
  servings: number;
}

export function RecipeHeader({
  title,
  image,
  prepTime,
  cookTime,
  servings,
}: RecipeHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-lg">
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="mb-2 inline-block rounded-full bg-orange-500 px-2.5 py-1 text-xs text-white">
            Featured Recipe
          </div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
      </div>
      <div className="flex gap-4 bg-gradient-to-br from-orange-50 to-amber-50 p-4 text-gray-700">
        <div className="flex flex-1 items-center gap-1.5">
          <Clock className="h-4 w-4 flex-shrink-0 text-orange-500" />
          <div>
            <div className="text-[10px] text-gray-500">Prep</div>
            <div className="text-xs font-semibold">{prepTime}</div>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-1.5">
          <Clock className="h-4 w-4 flex-shrink-0 text-orange-500" />
          <div>
            <div className="text-[10px] text-gray-500">Cook</div>
            <div className="text-xs font-semibold">{cookTime}</div>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-1.5">
          <Users className="h-4 w-4 flex-shrink-0 text-orange-500" />
          <div>
            <div className="text-[10px] text-gray-500">Servings</div>
            <div className="text-xs font-semibold">{servings}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

