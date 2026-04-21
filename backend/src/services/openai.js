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
 * Local mock that mimics the shape of a gpt-4o generated recipe.
 * Activated when AIPRON_MOCK_RECIPES=true in the environment, which lets us
 * test the full generate -> save -> render -> search pipeline without
 * spending OpenAI credits.
 */
function buildMockRecipe(prompt, opts) {
  const { dietaryFilters = [], servings = 4, skillLevel = "intermediate" } = opts;
  const cleanedPrompt = String(prompt || "").trim().replace(/\s+/g, " ");
  const short = cleanedPrompt ? cleanedPrompt.slice(0, 40) : "Weeknight dinner";
  const title = `Mock: ${short.charAt(0).toUpperCase()}${short.slice(1)}`;

  return {
    title,
    description: `Mock recipe generated locally from prompt: "${cleanedPrompt || "(empty)"}"`,
    ingredients: [
      { name: "Olive oil", quantity: 2, unit: "tbsp" },
      { name: "Garlic, minced", quantity: 3, unit: "clove" },
      { name: "Yellow onion, diced", quantity: 1, unit: "medium" },
      { name: "Kosher salt", quantity: 1, unit: "tsp" },
      { name: "Black pepper", quantity: 0.5, unit: "tsp" },
      { name: "Mock main ingredient", quantity: 1, unit: "lb" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Heat olive oil in a skillet over medium heat.", duration: 120, timerRequired: false },
      { stepNumber: 2, instruction: "Add onion and cook until translucent, about 4 minutes.", duration: 240, timerRequired: true },
      { stepNumber: 3, instruction: "Stir in garlic and cook until fragrant.", duration: 60, timerRequired: false },
      { stepNumber: 4, instruction: "Add the main ingredient, season with salt and pepper, and cook through.", duration: 600, timerRequired: true },
      { stepNumber: 5, instruction: "Taste, adjust seasoning, and serve.", duration: 60, timerRequired: false },
    ],
    prepTime: 10,
    cookTime: 20,
    totalTime: 30,
    servings,
    nutrition: { calories: 420, protein: 28, carbs: 32, fat: 18 },
    dietaryTags: Array.isArray(dietaryFilters) ? dietaryFilters : [],
    cuisine: "Test Kitchen",
    difficulty: skillLevel,
  };
}

function isMockEnabled() {
  const v = String(process.env.AIPRON_MOCK_RECIPES || "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
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
    usePantry = false,
  } = options;

  if (isMockEnabled()) {
    console.log("[openai] AIPRON_MOCK_RECIPES is on — returning mock recipe");
    return buildMockRecipe(prompt, { dietaryFilters, servings, skillLevel });
  }

  let pantryBlock = "";
  if (usePantry) {
    if (availableIngredients.length > 0) {
      pantryBlock = `
Pantry mode is ON. The cook has these ingredients on hand. Prefer a recipe that uses as many of them as reasonably possible; only add common staples if needed (salt, oil, basic spices, etc.):
${availableIngredients.join(", ")}`;
    } else {
      pantryBlock = `
Pantry mode is ON but the user has no pantry items saved yet. Create a recipe from their request alone. In the recipe "description", add one short sentence inviting them to add ingredients in Pantry for tighter suggestions next time.`;
    }
  }

  const systemPrompt = `You are a professional chef and cooking assistant. Generate detailed, accurate recipes that are:
- Clear and easy to follow
- Include precise measurements
- Provide realistic timing estimates
- Consider dietary restrictions: ${dietaryFilters.join(", ") || "none"}
- Appropriate for ${skillLevel} skill level
- Serve ${servings} people
${pantryBlock}

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
  if (isMockEnabled()) {
    console.log("[openai] AIPRON_MOCK_RECIPES is on — returning mock substitutions");
    return [
      { name: `Mock substitute A for ${ingredient}`, ratio: "1:1", notes: "Works well in most dishes." },
      { name: `Mock substitute B for ${ingredient}`, ratio: "1:1", notes: "Slightly different flavor profile." },
    ];
  }

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
/**
 * Stateless cooking Q&A for web/mobile chat UIs (messages: { role, content }[]).
 */
export async function chatWithAssistant(messages, userContext = "", language = "English") {
  if (isMockEnabled()) {
    console.log("[openai] AIPRON_MOCK_RECIPES is on — returning mock chat reply");
    const last = Array.isArray(messages) ? [...messages].reverse().find((m) => m?.role === "user") : null;
    const userText = String(last?.content ?? "").trim() || "(no message)";
    const short = userText.length > 120 ? userText.slice(0, 117) + "..." : userText;
    return `(Mock mode) I heard: "${short}". Recipe generation is mocked — try the Pantry tab and tap a suggestion to see the end-to-end AI-generated recipe flow with the "AI generated" badge.`;
  }

  const langInstruction = language && language !== "English"
    ? ` Always respond in ${language}.`
    : "";
  const systemPrompt = `You are a helpful professional cooking assistant for AIpron. Answer clearly about recipes, techniques, substitutions, timing, and food safety. Be concise unless the user asks for more detail.${langInstruction}${userContext}`;

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: String(m.content ?? ""),
      })),
    ],
    temperature: 0.7,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Empty model response");
  }
  return text;
}

export async function findPantryRecipes(ingredients, dietaryFilters = [], limit = 5) {
  if (isMockEnabled()) {
    console.log("[openai] AIPRON_MOCK_RECIPES is on — returning mock pantry suggestions");
    const seed = Array.isArray(ingredients) && ingredients.length > 0
      ? ingredients.slice(0, 3).join(", ")
      : "pantry staples";
    const base = [
      { title: `Mock Skillet with ${seed}`, description: "A quick one-pan weeknight meal.", matchPercentage: 92 },
      { title: `Mock Roasted ${seed}`, description: "Simple oven-roasted dinner.", matchPercentage: 84 },
      { title: `Mock Pasta with ${seed}`, description: "Pantry pasta that comes together fast.", matchPercentage: 76 },
      { title: `Mock Grain Bowl with ${seed}`, description: "Hearty bowl with what you have on hand.", matchPercentage: 68 },
      { title: `Mock Soup with ${seed}`, description: "Cozy soup using your pantry.", matchPercentage: 61 },
    ];
    return base.slice(0, Math.max(1, Math.min(limit, base.length)));
  }

  const prompt = `You are helping a cooking app suggest recipe ideas based on a user's pantry. Please suggest ${limit} recipes.

Pantry ingredients: ${ingredients.join(", ")}
Dietary restrictions: ${dietaryFilters.join(", ") || "none"}.

Return JSON in this exact shape:
{
  "recipes": [
    {
      "title": "Recipe name",
      "description": "One sentence description",
      "matchPercentage": 0
    }
  ]
}

Rules:
- Return exactly ${limit} recipes.
- "title" must be a concise, realistic recipe name.
- "matchPercentage" must be a number from 0 to 100 indicating how well it matches the pantry.
- Do not include any extra top-level keys besides "recipes".`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.recipes)) return result.recipes;
    return [];
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to find pantry recipes");
  }
}
