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
    usePantry = false,
  } = options;

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
- For each step, set "phase" to "prep" (mise, chopping, measuring, marinating, room-temp rest, cold mixing) or "cook" (heat, oven, boiling, finishing on the stove, or combining components while cooking). Order steps so all prep phases come before cook phases when possible.
${pantryBlock}

Format your response as JSON with this structure:
{
  "title": "Recipe Title",
  "description": "Brief description",
  "ingredients": [{"name": "ingredient", "quantity": 1, "unit": "cup"}],
  "steps": [{"stepNumber": 1, "phase": "prep", "instruction": "...", "duration": 300, "timerRequired": false}],
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
/**
 * Stateless cooking Q&A for web/mobile chat UIs (messages: { role, content }[]).
 */
export async function chatWithAssistant(messages, userContext = "", language = "English") {
  const langInstruction = language && language !== "English"
    ? ` Always respond in ${language}.`
    : "";
  const systemPrompt = `You are a helpful professional cooking assistant for Aipron.

Response format (follow closely):
- Use plain text only. Do not use markdown symbols: no # headings, no **bold**, no __underscores__, no backticks.
- Organize with short section titles on their own line (e.g. "Ingredients" or "Instructions"), then a blank line, then the body.
- For ingredient lists, use one line per item starting with "- " (hyphen and space).
- For step-by-step cooking, use numbered lines: "1. ", "2. ", etc., with one clear sentence per step (easy to read aloud and for voice/TTS).
- Keep sentences short and conversational. Avoid long dense paragraphs.
- Be accurate on food safety and timing. Be concise unless the user asks for more detail.${langInstruction}${userContext}`;

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
