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
const BUDGET_RECIPE_INSTRUCTIONS = `
BUDGET MODE (prioritize affordability and accessibility):
- Prefer common pantry staples and widely available supermarket ingredients; avoid specialty or rare items unless essential.
- Choose lower-cost proteins when appropriate (e.g. beans, lentils, eggs, canned fish, chicken thighs) instead of premium cuts or exotic seafood.
- Minimize the number of distinct ingredients when reasonable; avoid one-off purchases.
- Include optional fields "estimatedCostBand" ("low", "medium", or "high") as a rough relative estimate only, and "budgetNotes" (one short sentence on tradeoffs). These are NOT real prices or guarantees.`;

export async function generateRecipe(prompt, options = {}) {
  const {
    dietaryFilters = [],
    servings = 4,
    skillLevel = "intermediate",
    budgetMode = false,
  } = options;

  const budgetBlock = budgetMode
    ? BUDGET_RECIPE_INSTRUCTIONS
    : "";

  const systemPrompt = `You are a professional chef and cooking assistant. Generate detailed, accurate recipes that are:
- Clear and easy to follow
- Include precise measurements
- Provide realistic timing estimates
- Consider dietary restrictions: ${dietaryFilters.join(", ") || "none"}
- Appropriate for ${skillLevel} skill level
- Serve ${servings} people
${budgetBlock}
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
  "difficulty": "intermediate"${budgetMode ? ',\n  "estimatedCostBand": "low",\n  "budgetNotes": "optional short explanation"' : ""}
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
export async function getSubstitutions(ingredient, dietaryFilters = [], options = {}) {
  const { budgetMode = false } = options;
  const budgetLine = budgetMode
    ? "\nPrioritize cheaper and easier-to-find alternatives where reasonable; still respect dietary restrictions."
    : "";
  const prompt = `Suggest 2-3 substitutions for "${ingredient}". 
Consider dietary restrictions: ${dietaryFilters.join(", ") || "none"}.
${budgetLine}
Return JSON object: {"substitutions": [{"name": "substitute", "ratio": "1:1", "notes": "..."}]}`;

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
 * Multi-turn chat with the AI cooking assistant
 */
export async function chatWithAssistant(messages) {
  const systemPrompt =
    "You are Chef Aipron, a warm and friendly cooking companion. " +
    "Talk like a real person — encouraging, casual, and passionate about food. " +
    "Never say you are code, a program, or an AI. You are simply a chef who loves helping people cook. " +
    "Use short, conversational sentences. Feel free to sprinkle in enthusiasm about food. " +
    "Help with recipes, cooking tips, ingredient swaps, meal planning, and techniques. " +
    "Keep answers concise but personable.";

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI chat error:", error);
    throw new Error("Failed to get assistant response");
  }
}

/**
 * Find recipes matching pantry ingredients
 */
export async function findPantryRecipes(ingredients, dietaryFilters = [], limit = 5, options = {}) {
  const { budgetMode = false } = options;
  const budgetLine = budgetMode
    ? "\nBUDGET MODE: Favor recipes that are affordable and use common ingredients; avoid suggesting dishes that rely on expensive specialty items."
    : "";
  const prompt = `Given these ingredients: ${ingredients.join(", ")}, suggest ${limit} recipes that use most of them.
Dietary restrictions: ${dietaryFilters.join(", ") || "none"}.
${budgetLine}
Return JSON object: {"recipes": [{"title": "...", "description": "...", "matchPercentage": 85, "missingIngredients": [], "ingredientsUsed": []}]}`;

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
