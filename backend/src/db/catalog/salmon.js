/** @returns {Record<string, unknown>} */
export function salmonCatalogRecipe() {
  const servings = 4;
  return {
    user_id: null,
    is_public: true,
    title: "Crispy-Skinned Salmon with Lemon-Dill Yogurt Sauce + Garlicky Green Beans (30 minutes)",
    description:
      "Crispy skin salmon (pan-seared) with a bright lemon-dill yogurt sauce and quick sautéed green beans. " +
      "Searchable keywords/substitutions: Greek yogurt or sour cream, dill or parsley, salmon or trout, " +
      "green beans or asparagus, olive oil or avocado oil, Dijon mustard or whole-grain mustard.",
    cuisine: "Modern American",
    difficulty: "beginner",
    dietary_tags: ["gluten-free", "low-carb"],
    prep_time: 10,
    cook_time: 20,
    total_time: 30,
    servings,
    nutrition: { calories: 520, protein: 42, carbs: 14, fat: 33 },
    ingredients: [
      {
        name: "Salmon fillets, skin-on (about 1 inch / 2.5 cm thick each)",
        quantity: 680,
        unit: "g",
        notes:
          "4 fillets at ~170 g each. Substitutions: steelhead trout (1:1), Arctic char (1:1). If skinless, sear 2 minutes less per side and expect less crisp.",
      },
      {
        name: "Kosher salt",
        quantity: 1.5,
        unit: "tsp",
        notes:
          "For salmon + beans. If using fine table salt, use 1 tsp total (it’s saltier by volume).",
      },
      {
        name: "Black pepper, freshly ground",
        quantity: 0.75,
        unit: "tsp",
        notes: "Substitution: 1/2 tsp pre-ground black pepper.",
      },
      {
        name: "Avocado oil (or extra-virgin olive oil), divided",
        quantity: 2,
        unit: "tbsp",
        notes:
          "High-heat oil preferred for crisp skin. Substitutions: grapeseed oil (1:1), canola (1:1).",
      },
      {
        name: "Unsalted butter",
        quantity: 1,
        unit: "tbsp",
        notes:
          "Optional but recommended for basting. Dairy-free: use 1 tbsp extra oil instead.",
      },
      {
        name: "Lemon, divided",
        quantity: 1,
        unit: "each",
        notes:
          "You’ll use 1 tsp zest + 2 tbsp juice for sauce, plus wedges for serving. Bottled juice works in a pinch (2 tbsp).",
      },
      {
        name: "Plain Greek yogurt (2% or whole)",
        quantity: 160,
        unit: "g",
        notes:
          "About 2/3 cup. Substitutions: sour cream (1:1), labneh (1:1), dairy-free unsweetened yogurt (1:1; add 1 tsp extra lemon juice).",
      },
      {
        name: "Dijon mustard",
        quantity: 1,
        unit: "tsp",
        notes:
          "Substitutions: whole-grain mustard (1:1), yellow mustard (use 2 tsp; milder).",
      },
      {
        name: "Honey (or maple syrup)",
        quantity: 1,
        unit: "tsp",
        notes:
          "Balances acidity. Substitutions: maple syrup (1:1), sugar (1 tsp). Omit for very low-carb and increase salt by a pinch.",
      },
      {
        name: "Fresh dill, finely chopped (or parsley)",
        quantity: 2,
        unit: "tbsp",
        notes:
          "Substitutions: flat-leaf parsley (1:1), dried dill (2 tsp; add earlier and let sit 5 minutes).",
      },
      {
        name: "Garlic cloves, minced",
        quantity: 3,
        unit: "cloves",
        notes:
          "Substitutions: 3/4 tsp garlic powder added with the beans; or 1 1/2 tbsp jarred minced garlic.",
      },
      {
        name: "Green beans, trimmed",
        quantity: 340,
        unit: "g",
        notes:
          "Substitutions: asparagus (340 g; cook 3–5 min), broccolini (340 g; cook 5–7 min).",
      },
      {
        name: "Water",
        quantity: 60,
        unit: "ml",
        notes:
          "Used to steam-finish the beans. Substitution: chicken/veg broth (60 ml) for more flavor.",
      },
      {
        name: "Red pepper flakes (optional)",
        quantity: 0.25,
        unit: "tsp",
        notes: "Optional heat. Substitution: a pinch of cayenne.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          "Pat the salmon very dry with paper towels (this is key for crispy skin). Season the flesh side with 1 tsp kosher salt and 1/2 tsp black pepper. Leave at room temp while you prep the sauce (5–10 minutes).",
        duration: 600,
        timerRequired: true,
      },
      {
        stepNumber: 2,
        instruction:
          "Make the lemon-dill yogurt sauce: zest the lemon (1 tsp) and juice it (2 tbsp). In a bowl, whisk together yogurt, lemon zest, lemon juice, Dijon, honey, 1/4 tsp salt, and dill. Taste and adjust: more lemon for brightness, a pinch more salt for balance. Refrigerate until serving.",
        duration: 360,
        timerRequired: false,
      },
      {
        stepNumber: 3,
        instruction:
          "Prep the green beans: trim ends. Mince the garlic. Keep beans and garlic separate so the garlic doesn’t burn.",
        duration: 240,
        timerRequired: false,
      },
      {
        stepNumber: 4,
        instruction:
          "Crisp the salmon: heat a large skillet over medium-high for 2 minutes. Add 1 tbsp oil. Place salmon skin-side down, then immediately press each fillet with a spatula for 10 seconds to prevent curling. Cook skin-side down 6–8 minutes until the skin is deeply golden and releases easily.",
        duration: 480,
        timerRequired: true,
      },
      {
        stepNumber: 5,
        instruction:
          "Flip salmon and baste: reduce heat to medium. Add butter to the pan. Once melted, tilt the pan and spoon butter over the salmon for 30 seconds. Cook 2–4 minutes more (depending on thickness) until the thickest part is just opaque and flakes easily. Transfer salmon to a plate, skin-side up.",
        duration: 240,
        timerRequired: true,
      },
      {
        stepNumber: 6,
        instruction:
          "Cook the green beans in the same skillet: keep heat at medium. Add remaining 1 tbsp oil if the pan is dry. Add beans and 1/4 tsp salt, tossing 1 minute. Add garlic and red pepper flakes (optional) and cook 30 seconds until fragrant.",
        duration: 90,
        timerRequired: false,
      },
      {
        stepNumber: 7,
        instruction:
          "Steam-finish beans: add water, cover, and steam 3–4 minutes until crisp-tender. Uncover and cook 30–60 seconds to evaporate excess water. Taste and add remaining pepper as needed.",
        duration: 270,
        timerRequired: true,
      },
      {
        stepNumber: 8,
        instruction:
          "Serve: spoon lemon-dill yogurt sauce onto plates (or dollop on salmon), add green beans, and finish with lemon wedges. Keep salmon skin facing up so it stays crisp.",
        duration: 120,
        timerRequired: false,
      },
    ],
  };
}
