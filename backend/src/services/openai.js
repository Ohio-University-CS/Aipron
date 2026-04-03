import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is missing. Set it in backend/.env (see backend/.env.example)."
      );
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Generate a recipe based on user input
 */
export async function generateRecipe(prompt, options = {}) {
  const {
    dietaryFilters = [],
    servings = 4,
    skillLevel = "intermediate",
    availableIngredients = [],
  } = options;

  const systemPrompt = `You are a professional chef and cooking assistant. Generate detailed, accurate recipes that are:
- Clear and easy to follow
- Include precise measurements
- Provide realistic timing estimates
- Consider dietary restrictions: ${dietaryFilters.join(", ") || "none"}
- Appropriate for ${skillLevel} skill level
- Serve ${servings} people

Format your response as JSON with this structure:
{
  "title": "Recipe Title",
  "description": "Brief description",
  "ingredients": [{"name": "ingredient", "quantity": 1, "unit": "cup"}],
  "steps": [{"stepNumber": 1, "instruction": "...", "duration": 300, "timerRequired": false}],
  "prepTime": 15,
  "cookTime": 30,
  "totalTime": 45,
  "servings": 4,
  "nutrition": {"calories": 350, "protein": 20, "carbs": 30, "fat": 15},
  "dietaryTags": ["vegetarian"],
  "cuisine": "Italian",
  "difficulty": "intermediate"
}`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const recipe = JSON.parse(completion.choices[0].message.content);
    return recipe;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate recipe");
  }
}

/**
 * Get ingredient substitutions
 */
export async function getSubstitutions(ingredient, dietaryFilters = []) {
  const prompt = `Suggest 2-3 substitutions for "${ingredient}". 
Consider dietary restrictions: ${dietaryFilters.join(", ") || "none"}.
Return JSON array: [{"name": "substitute", "ratio": "1:1", "notes": "..."}]`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result.substitutions || [];
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get substitutions");
  }
}

/**
 * Find recipes matching pantry ingredients
 */
export async function findPantryRecipes(ingredients, dietaryFilters = [], limit = 5) {
  const prompt = `Given these ingredients: ${ingredients.join(", ")}, suggest ${limit} recipes that use most of them.
Dietary restrictions: ${dietaryFilters.join(", ") || "none"}.
Return JSON array of recipes with match percentage.`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result.recipes || [];
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to find pantry recipes");
  }
}
