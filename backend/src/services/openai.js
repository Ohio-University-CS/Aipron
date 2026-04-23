import OpenAI from "openai";
import dotenv from "dotenv";
import { normalizeRecipeStepDurations } from "../utils/normalizeRecipeStepDurations.js";
import { fetchDietaryContext } from "./userContext.js";

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
    userId = null,
  } = options;

  // Merge the caller-supplied dietaryFilters with anything the user has saved
  // in their profile, so preferences apply to every generation — even when the
  // client does not explicitly pass them.
  const profilePrefs = userId ? await fetchDietaryContext(userId) : [];
  const mergedDietary = Array.from(
    new Set([...(Array.isArray(dietaryFilters) ? dietaryFilters : []), ...profilePrefs])
  );

  if (isMockEnabled()) {
    console.log("[openai] AIPRON_MOCK_RECIPES is on — returning mock recipe");
    return buildMockRecipe(prompt, { dietaryFilters: mergedDietary, servings, skillLevel });
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
- Strictly respect these dietary restrictions: ${mergedDietary.join(", ") || "none"}. If a restriction rules out an ingredient, swap it for a compliant alternative — never include it.
- Include every one of those restrictions in the output "dietaryTags" array exactly as given (lowercased), plus any other tags that apply. Only emit tags the recipe actually satisfies.
- Appropriate for ${skillLevel} skill level
- Serve ${servings} people
- For each step, set "phase" to "prep" (mise, chopping, measuring, marinating, room-temp rest, cold mixing) or "cook" (heat, oven, boiling, finishing on the stove, or combining components while cooking). Order steps so all prep phases come before cook phases when possible.
- For each step, "duration" is ALWAYS in seconds (integer). prepTime, cookTime, and totalTime are in minutes, but step durations are never in minutes: 1 minute = 60, 5 minutes = 300, 30 minutes = 1800, 90 seconds = 90. When timerRequired is true, duration must match the time described in that step's instruction.
- Always populate "mainIngredient" (the dish's primary protein or star ingredient, lowercased, single noun like "chicken", "tofu", "salmon", "mushroom") and "dishType" (a high-level food category, lowercased, like "soup", "pasta", "stir-fry", "salad", "sandwich", "curry", "taco", "pizza", "bowl", "roast", "stew", "pancake", "cookie"). These are used for image matching.
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
  "difficulty": "intermediate",
  "mainIngredient": "chicken",
  "dishType": "stir-fry"
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
    if (recipe && Array.isArray(recipe.steps)) {
      recipe.steps = normalizeRecipeStepDurations(recipe.steps);
    }
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
const CREATE_RECIPE_TOOL = {
  type: "function",
  function: {
    name: "create_recipe",
    description:
      "Create a full structured recipe and save it to the user's personal cookbook (also favorited by default). Call this whenever the user asks for a recipe, asks to save/add/cook something, or when you would otherwise write out ingredients and numbered steps in chat. The recipe content will NOT be shown in the chat window — only a short confirmation sentence.",
    parameters: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description:
            "A clear natural-language description of the dish to generate. If the user named a specific dish, use that. Otherwise summarize the meal being discussed in the recent conversation (cuisine, key ingredients, constraints like 'high protein', 'quick weeknight', etc).",
        },
        dietaryFilters: {
          type: "array",
          items: { type: "string" },
          description:
            "Dietary tags to respect (e.g. 'vegetarian', 'gluten-free', 'dairy-free'). Infer from user profile/context when reasonable; otherwise empty.",
        },
        servings: {
          type: "integer",
          minimum: 1,
          maximum: 12,
          description: "Number of servings. Default 4 if unknown.",
        },
        skillLevel: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
          description: "Skill level for the recipe. Default 'intermediate'.",
        },
      },
      required: ["description"],
    },
  },
};

function buildChatSystemPrompt(userContext, language, toolsEnabled) {
  const langInstruction = language && language !== "English"
    ? ` Always respond in ${language}.`
    : "";

  const toolsBlock = toolsEnabled
    ? `

Recipe creation policy (critical):
- NEVER write a full recipe in chat. Do not output ingredient lists with measurements, and do not output numbered step-by-step cooking instructions.
- When the user asks for a recipe, asks to save/add/cook/bookmark something, or you would otherwise describe a complete meal with measured ingredients and numbered steps: call the create_recipe tool instead.
- For "save that" / "add that to my saved tab" style requests, derive the create_recipe "description" from the recent conversation (what meal you were just describing). For explicit requests like "give me a high-protein dinner", derive it from the user's message.
- After the create_recipe tool returns, reply with exactly ONE short sentence confirming the save and naming the recipe. Example: "Saved 'High-Protein Chicken Bowl' to your Saved tab — tap it and hit Start Cooking when you're ready." Do NOT list ingredients or steps in the confirmation.
- Quick cooking questions that are not recipes (e.g. "how hot for roasting veg?", "can I sub butter for oil?") should be answered directly in chat without calling the tool.`
    : "";

  return `You are a helpful professional cooking assistant for Aipron.

Dietary policy (critical, non-negotiable):
- Before you reply to anything food-related, check the "DIETARY PREFERENCES" line in the User Context below (if present).
- Those preferences apply to EVERY response: direct recipes, quick answers, summaries, "what is X", "how is X made", comparisons, and anything you write about a dish.
- Never describe, summarize, recommend, or suggest ingredients/steps for a dish that violates the user's preferences — even when they ask about it by name. Do not produce a "typical" or "classic" version either.
- When the user asks about a non-compliant dish, reply in this shape: one short sentence noting it doesn't fit their preferences, then immediately offer one compliant alternative (name it) and ask if they'd like you to create/save it. Example for a vegan user asking about "beef tacos": "Beef doesn't fit your vegan preference. I can make you lentil-walnut tacos with the same seasoning profile — want me to save that recipe?"
- The only exception is if the user explicitly says in the current turn to ignore their preferences.

Response format (follow closely):
- Use plain text only. Do not use markdown symbols: no # headings, no **bold**, no __underscores__, no backticks.
- Organize with short section titles on their own line (e.g. "Ingredients" or "Instructions"), then a blank line, then the body.
- For ingredient lists, use one line per item starting with "- " (hyphen and space).
- For step-by-step cooking, use numbered lines: "1. ", "2. ", etc., with one clear sentence per step (easy to read aloud and for voice/TTS).
- Keep sentences short and conversational. Avoid long dense paragraphs.
- Be accurate on food safety and timing. Be concise unless the user asks for more detail.${langInstruction}${toolsBlock}${userContext}`;
}

function getLastUserText(messages) {
  const last = Array.isArray(messages)
    ? [...messages].reverse().find((m) => m?.role === "user")
    : null;
  return String(last?.content ?? "").trim();
}

function looksLikeRecipeRequest(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return (
    /\brecipe\b/.test(t) ||
    /\bsave (it|that|this|the recipe)\b/.test(t) ||
    /\badd (it|that|this) to (my )?(saved|favorites|favourites)\b/.test(t) ||
    /\b(cook|make) (it|that|this) later\b/.test(t) ||
    /\bbookmark\b/.test(t) ||
    /\bi want to (cook|make)\b/.test(t)
  );
}

/**
 * Stateless cooking Q&A for web/mobile chat UIs (messages: { role, content }[]).
 *
 * When opts.onCreateRecipe is provided, the assistant is given a create_recipe
 * tool. The model decides when to call it (based on the system prompt); on a
 * tool call we invoke the handler and do one follow-up completion so the model
 * can produce a short confirmation message.
 */
export async function chatWithAssistant(
  messages,
  userContext = "",
  language = "English",
  opts = {}
) {
  const { onCreateRecipe } = opts;
  const toolsEnabled = typeof onCreateRecipe === "function";

  if (isMockEnabled()) {
    console.log("[openai] AIPRON_MOCK_RECIPES is on — returning mock chat reply");
    const userText = getLastUserText(messages) || "(no message)";

    if (toolsEnabled && looksLikeRecipeRequest(userText)) {
      try {
        const { id, title } = await onCreateRecipe({
          description: userText,
          dietaryFilters: [],
          servings: 4,
          skillLevel: "intermediate",
        });
        return `Saved "${title}" to your Saved tab — tap it and hit Start Cooking when you're ready. (mock id ${id})`;
      } catch (err) {
        console.error("[openai mock] create_recipe handler failed:", err);
        return "I tried to save that recipe but ran into an error. Please try again.";
      }
    }

    const short = userText.length > 120 ? userText.slice(0, 117) + "..." : userText;
    return `(Mock mode) I heard: "${short}". Recipe generation is mocked — try the Pantry tab and tap a suggestion to see the end-to-end AI-generated recipe flow with the "AI generated" badge.`;
  }

  const systemPrompt = buildChatSystemPrompt(userContext, language, toolsEnabled);
  const openai = getOpenAIClient();

  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: String(m.content ?? ""),
    })),
  ];

  const baseRequest = {
    model: "gpt-4o-mini",
    messages: chatMessages,
    temperature: 0.7,
  };
  if (toolsEnabled) {
    baseRequest.tools = [CREATE_RECIPE_TOOL];
    baseRequest.tool_choice = "auto";
  }

  const completion = await openai.chat.completions.create(baseRequest);
  const choice = completion.choices[0];
  const message = choice?.message;
  const toolCalls = message?.tool_calls || [];

  if (toolsEnabled && toolCalls.length > 0) {
    const toolResults = [];
    for (const call of toolCalls) {
      if (call?.type !== "function" || call.function?.name !== "create_recipe") {
        toolResults.push({
          tool_call_id: call.id,
          content: JSON.stringify({ error: "unknown tool" }),
        });
        continue;
      }

      let args = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }

      try {
        const description = String(args.description || "").trim() || getLastUserText(messages);
        const result = await onCreateRecipe({
          description,
          dietaryFilters: Array.isArray(args.dietaryFilters) ? args.dietaryFilters : [],
          servings: Number.isFinite(args.servings) ? args.servings : 4,
          skillLevel: ["beginner", "intermediate", "advanced"].includes(args.skillLevel)
            ? args.skillLevel
            : "intermediate",
        });
        toolResults.push({
          tool_call_id: call.id,
          content: JSON.stringify({ ok: true, id: result.id, title: result.title }),
        });
      } catch (err) {
        console.error("[openai] create_recipe handler failed:", err);
        toolResults.push({
          tool_call_id: call.id,
          content: JSON.stringify({ ok: false, error: "failed to save recipe" }),
        });
      }
    }

    const followUp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        ...chatMessages,
        {
          role: "assistant",
          content: message.content ?? "",
          tool_calls: toolCalls,
        },
        ...toolResults.map((r) => ({
          role: "tool",
          tool_call_id: r.tool_call_id,
          content: r.content,
        })),
      ],
    });

    const text = followUp.choices[0]?.message?.content?.trim();
    if (text) return text;

    // Fallback confirmation if the follow-up produced no text.
    const firstOk = toolResults
      .map((r) => {
        try {
          return JSON.parse(r.content);
        } catch {
          return null;
        }
      })
      .find((r) => r && r.ok);
    if (firstOk) {
      return `Saved "${firstOk.title}" to your Saved tab — tap it and hit Start Cooking when you're ready.`;
    }
    return "I tried to save that recipe but ran into an error. Please try again.";
  }

  const text = message?.content?.trim();
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
