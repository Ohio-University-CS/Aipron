import { salmonCatalogRecipe } from "./salmon.js";

/**
 * All public catalog rows for Supabase `recipes` insert (snake_case).
 * Order: stable for docs only; seed script dedupes by title + is_public.
 */
export const PUBLIC_CATALOG_RECIPES = [
  salmonCatalogRecipe(),
  onePotLemonHerbChickenRice(),
  redLentilDalWithRice(),
  beefBroccoliStirFry(),
  bakedCodTomatoesOlives(),
  creamyMushroomRisotto(),
  chickpeaShawarmaBowl(),
  thaiRedCoconutCurryTofu(),
];

function onePotLemonHerbChickenRice() {
  const servings = 4;
  return {
    user_id: null,
    is_public: true,
    title: "One-Pot Lemon-Herb Chicken Thighs with Rice (45 minutes)",
    description:
      "Crispy-skinned bone-in chicken thighs, fluffy long-grain rice, and a bright lemon-herb finish in one Dutch oven or deep skillet. " +
      "Keywords/subs: chicken thighs or drumsticks, jasmine or basmati rice, chicken broth or water, thyme or rosemary, butter or olive oil.",
    cuisine: "American",
    difficulty: "beginner",
    dietary_tags: ["gluten-free"],
    prep_time: 15,
    cook_time: 45,
    total_time: 60,
    servings,
    nutrition: { calories: 540, protein: 38, carbs: 48, fat: 22 },
    ingredients: [
      {
        name: "Bone-in, skin-on chicken thighs",
        quantity: 900,
        unit: "g",
        notes:
          "~4 large thighs (~225 g each). Subs: bone-in drumsticks (900 g; cook 5 min longer), skinless thighs (reduce oil by 1 tbsp).",
      },
      {
        name: "Kosher salt",
        quantity: 2,
        unit: "tsp",
        notes: "Divided for chicken + rice. Fine salt: use 1 1/2 tsp total.",
      },
      {
        name: "Black pepper, freshly ground",
        quantity: 1,
        unit: "tsp",
        notes: "Sub: 3/4 tsp pre-ground.",
      },
      {
        name: "Smoked paprika (optional)",
        quantity: 1,
        unit: "tsp",
        notes: "Sub: sweet paprika or omit.",
      },
      {
        name: "Extra-virgin olive oil",
        quantity: 2,
        unit: "tbsp",
        notes: "Sub: avocado oil (1:1).",
      },
      {
        name: "Yellow onion, diced",
        quantity: 1,
        unit: "each",
        notes: "~200 g. Sub: shallots (3 medium).",
      },
      {
        name: "Garlic cloves, minced",
        quantity: 4,
        unit: "cloves",
        notes: "Sub: 1 tsp garlic powder (add with rice).",
      },
      {
        name: "Long-grain white rice (uncooked)",
        quantity: 300,
        unit: "g",
        notes:
          "~1 1/2 cups. Subs: jasmine (1:1), basmati (1:1; rinse until clear). Do not use instant rice.",
      },
      {
        name: "Low-sodium chicken broth",
        quantity: 720,
        unit: "ml",
        notes: "Sub: water + 1 tsp bouillon paste, or vegetable broth.",
      },
      {
        name: "Lemon (zest + juice)",
        quantity: 1,
        unit: "each",
        notes: "Zest 1 tsp; juice 2 tbsp. Sub: 2 tbsp bottled lemon juice.",
      },
      {
        name: "Fresh thyme leaves (or rosemary, chopped)",
        quantity: 2,
        unit: "tsp",
        notes: "Sub: 3/4 tsp dried thyme (crush between fingers).",
      },
      {
        name: "Unsalted butter",
        quantity: 1,
        unit: "tbsp",
        notes: "Finish. Sub: 1 tbsp olive oil.",
      },
      {
        name: "Fresh parsley, chopped (optional)",
        quantity: 2,
        unit: "tbsp",
        notes: "Garnish. Sub: dill.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          "Pat chicken very dry. Mix 1 tsp salt, 1/2 tsp pepper, and paprika. Season chicken on both sides (reserve a pinch of salt for rice).",
        duration: 300,
        timerRequired: false,
      },
      {
        stepNumber: 2,
        instruction:
          "Heat a large Dutch oven or deep skillet with lid over medium-high. Add oil. Place chicken skin-side down; cook 6–7 minutes undisturbed until deeply golden. Flip; cook 3 minutes. Remove chicken to a plate (not fully cooked yet).",
        duration: 600,
        timerRequired: true,
      },
      {
        stepNumber: 3,
        instruction:
          "Reduce heat to medium. Add onion; cook 4 minutes. Add garlic; cook 30 seconds until fragrant.",
        duration: 270,
        timerRequired: false,
      },
      {
        stepNumber: 4,
        instruction:
          "Stir in rice to coat in fat 1 minute. Add broth, lemon zest, remaining 1 tsp salt, and 1/2 tsp pepper. Scrape browned bits. Nestle chicken skin-side up on top; bring to a simmer.",
        duration: 180,
        timerRequired: false,
      },
      {
        stepNumber: 5,
        instruction:
          "Cover; reduce heat to low. Simmer 22–25 minutes until rice absorbs liquid and chicken reaches 74°C / 165°F internal.",
        duration: 1500,
        timerRequired: true,
      },
      {
        stepNumber: 6,
        instruction:
          "Off heat. Rest covered 5 minutes. Drizzle lemon juice; dot butter. Sprinkle thyme and parsley. Fluff rice around chicken and serve.",
        duration: 300,
        timerRequired: true,
      },
    ],
  };
}

function redLentilDalWithRice() {
  const servings = 4;
  return {
    user_id: null,
    is_public: true,
    title: "Red Lentil Dal with Tempered Spices + Basmati Rice (40 minutes)",
    description:
      "Creamy masoor dal with a garlic-cumin-chili tadka, served with fluffy basmati. " +
      "Keywords/subs: red lentils or split masoor, ghee or coconut oil (vegan), tomato or canned diced tomato, basmati or jasmine.",
    cuisine: "Indian",
    difficulty: "beginner",
    dietary_tags: ["vegetarian", "vegan", "gluten-free", "dairy-free"],
    prep_time: 10,
    cook_time: 35,
    total_time: 45,
    servings,
    nutrition: { calories: 420, protein: 18, carbs: 68, fat: 8 },
    ingredients: [
      {
        name: "Red lentils (masoor dal), rinsed",
        quantity: 240,
        unit: "g",
        notes: "~1 1/4 cups. Sub: split red lentils (same weight).",
      },
      {
        name: "Water",
        quantity: 960,
        unit: "ml",
        notes: "For dal. Sub: half vegetable broth for depth.",
      },
      {
        name: "Roma tomatoes, diced",
        quantity: 200,
        unit: "g",
        notes: "~2 medium. Sub: 1 cup canned diced tomatoes + juice.",
      },
      {
        name: "Yellow onion, finely diced",
        quantity: 150,
        unit: "g",
        notes: "~1 medium.",
      },
      {
        name: "Fresh ginger, grated",
        quantity: 15,
        unit: "g",
        notes: "~1 tbsp. Sub: 1 tsp ginger paste.",
      },
      {
        name: "Garlic cloves, minced",
        quantity: 4,
        unit: "cloves",
        notes: "Sub: 1 tsp garlic powder (less punch).",
      },
      {
        name: "Ground turmeric",
        quantity: 1,
        unit: "tsp",
        notes: "",
      },
      {
        name: "Ground cumin",
        quantity: 1,
        unit: "tsp",
        notes: "",
      },
      {
        name: "Ground coriander",
        quantity: 1,
        unit: "tsp",
        notes: "",
      },
      {
        name: "Kosher salt",
        quantity: 1.5,
        unit: "tsp",
        notes: "Adjust at end. Low-sodium: start with 1 tsp.",
      },
      {
        name: "Ghee (or coconut oil for vegan)",
        quantity: 2,
        unit: "tbsp",
        notes: "For tadka + finish. Sub: neutral oil.",
      },
      {
        name: "Cumin seeds",
        quantity: 1,
        unit: "tsp",
        notes: "Sub: 1/2 tsp ground cumin (add with spices).",
      },
      {
        name: "Brown mustard seeds",
        quantity: 0.5,
        unit: "tsp",
        notes: "Optional pop. Sub: pinch mustard powder.",
      },
      {
        name: "Dried red chiles or red pepper flakes",
        quantity: 0.5,
        unit: "tsp",
        notes: "Heat to taste.",
      },
      {
        name: "Basmati rice (uncooked)",
        quantity: 200,
        unit: "g",
        notes: "Rinse until water runs clear. Cook separately: ~300 ml water, pinch salt, 15 min simmer.",
      },
      {
        name: "Fresh cilantro, chopped",
        quantity: 15,
        unit: "g",
        notes: "Garnish (~1/4 cup packed). Sub: mint.",
      },
      {
        name: "Lime, wedges",
        quantity: 1,
        unit: "each",
        notes: "Serve. Sub: lemon.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          "In a medium pot, combine lentils, water, tomato, onion, ginger, garlic, turmeric, ground cumin, coriander, and 1 tsp salt. Bring to a boil; skim foam. Reduce to gentle simmer; cook 20–25 minutes, stirring occasionally, until dal is creamy.",
        duration: 1500,
        timerRequired: true,
      },
      {
        stepNumber: 2,
        instruction:
          "Meanwhile, cook basmati per package or: combine rinsed rice + 300 ml water + pinch salt; simmer covered 12–15 minutes; rest 5 minutes.",
        duration: 900,
        timerRequired: true,
      },
      {
        stepNumber: 3,
        instruction:
          "Tadka: in a small skillet, heat ghee/oil over medium-high. Add cumin seeds and mustard seeds; cook 20–30 seconds until fragrant (cover if they pop). Add chiles/red pepper; swirl 15 seconds. Pour over dal; stir.",
        duration: 120,
        timerRequired: false,
      },
      {
        stepNumber: 4,
        instruction:
          "Taste dal; adjust salt. Serve over rice with cilantro and lime wedges.",
        duration: 120,
        timerRequired: false,
      },
    ],
  };
}

function beefBroccoliStirFry() {
  const servings = 4;
  return {
    user_id: null,
    is_public: true,
    title: "Beef and Broccoli Stir-Fry with Garlic-Ginger Sauce (25 minutes)",
    description:
      "Thin-sliced beef and crisp-tender broccoli in a savory soy-oyster-brown sugar sauce. " +
      "Keywords/subs: flank or sirloin, broccoli or broccolini, soy sauce or tamari (gluten-free), oyster sauce or mushroom stir-fry sauce.",
    cuisine: "Chinese-American",
    difficulty: "intermediate",
    dietary_tags: ["dairy-free"],
    prep_time: 15,
    cook_time: 10,
    total_time: 25,
    servings,
    nutrition: { calories: 380, protein: 32, carbs: 22, fat: 18 },
    ingredients: [
      {
        name: "Flank steak (or sirloin), sliced thin against the grain",
        quantity: 450,
        unit: "g",
        notes: "Sub: skirt steak. Partially freeze 20 min for easier slicing.",
      },
      {
        name: "Cornstarch (for velveting marinade)",
        quantity: 2,
        unit: "tsp",
        notes: "Sub: arrowroot (1:1).",
      },
      {
        name: "Baking soda (tiny pinch, optional tenderizer)",
        quantity: 0.125,
        unit: "tsp",
        notes: "Omit if sensitive to alkaline taste.",
      },
      {
        name: "Low-sodium soy sauce (or tamari)",
        quantity: 2,
        unit: "tbsp",
        notes: "1 tbsp for marinade, rest for sauce.",
      },
      {
        name: "Toasted sesame oil",
        quantity: 1,
        unit: "tsp",
        notes: "Marinade aroma. Sub: omit.",
      },
      {
        name: "Broccoli florets",
        quantity: 450,
        unit: "g",
        notes: "Sub: broccolini (450 g).",
      },
      {
        name: "Neutral high-heat oil (avocado or grapeseed)",
        quantity: 2,
        unit: "tbsp",
        notes: "Divided for sear + finish.",
      },
      {
        name: "Garlic cloves, minced",
        quantity: 4,
        unit: "cloves",
        notes: "",
      },
      {
        name: "Fresh ginger, grated",
        quantity: 15,
        unit: "g",
        notes: "~1 tbsp.",
      },
      {
        name: "Oyster sauce",
        quantity: 3,
        unit: "tbsp",
        notes: "Sub: vegetarian oyster sauce or hoisin (reduce sugar).",
      },
      {
        name: "Light brown sugar",
        quantity: 2,
        unit: "tsp",
        notes: "Sub: honey (2 tsp).",
      },
      {
        name: "Chicken or beef broth",
        quantity: 120,
        unit: "ml",
        notes: "Sub: water.",
      },
      {
        name: "Cornstarch (for sauce slurry)",
        quantity: 1,
        unit: "tsp",
        notes: "Mixed with 2 tbsp cold water.",
      },
      {
        name: "Toasted sesame seeds (optional)",
        quantity: 1,
        unit: "tsp",
        notes: "",
      },
      {
        name: "Cooked white rice, for serving",
        quantity: 600,
        unit: "g",
        notes: "~4 cups cooked. Sub: noodles.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          "Toss beef with 1 tbsp soy, cornstarch, baking soda, and sesame oil. Marinate 10 minutes at room temp.",
        duration: 600,
        timerRequired: true,
      },
      {
        stepNumber: 2,
        instruction:
          "Whisk sauce: remaining 1 tbsp soy, oyster sauce, brown sugar, broth. Mix slurry: 1 tsp cornstarch + 2 tbsp cold water.",
        duration: 120,
        timerRequired: false,
      },
      {
        stepNumber: 3,
        instruction:
          "Heat wok or large skillet over high until smoking-hot. Add 1 tbsp oil. Sear beef in one layer 60–90 seconds per side until browned; remove.",
        duration: 180,
        timerRequired: true,
      },
      {
        stepNumber: 4,
        instruction:
          "Add remaining 1 tbsp oil. Stir-fry broccoli 3–4 minutes until bright green with char spots. Add garlic and ginger; cook 30 seconds.",
        duration: 270,
        timerRequired: true,
      },
      {
        stepNumber: 5,
        instruction:
          "Return beef. Pour sauce; bring to boil. Stir slurry; drizzle in while tossing until glossy, 30–60 seconds. Serve over rice; top with sesame seeds.",
        duration: 90,
        timerRequired: false,
      },
    ],
  };
}

function bakedCodTomatoesOlives() {
  const servings = 4;
  return {
    user_id: null,
    is_public: true,
    title: "Baked Cod with Burst Tomatoes, Olives, and Capers (35 minutes)",
    description:
      "Mild white fish in a jammy cherry tomato pan sauce with briny olives and capers. " +
      "Keywords/subs: cod or haddock or pollock, Kalamata or Castelvetrano olives, white wine or extra broth, gluten-free as written.",
    cuisine: "Mediterranean",
    difficulty: "beginner",
    dietary_tags: ["gluten-free", "low-carb", "dairy-free"],
    prep_time: 10,
    cook_time: 25,
    total_time: 35,
    servings,
    nutrition: { calories: 310, protein: 34, carbs: 12, fat: 12 },
    ingredients: [
      {
        name: "Cod fillets (or haddock), 1–1.25 inches thick",
        quantity: 680,
        unit: "g",
        notes: "4 portions. Sub: pollock (680 g).",
      },
      {
        name: "Kosher salt",
        quantity: 1,
        unit: "tsp",
        notes: "Divided.",
      },
      {
        name: "Black pepper",
        quantity: 0.5,
        unit: "tsp",
        notes: "",
      },
      {
        name: "Cherry tomatoes",
        quantity: 400,
        unit: "g",
        notes: "Sub: grape tomatoes.",
      },
      {
        name: "Garlic cloves, thinly sliced",
        quantity: 4,
        unit: "cloves",
        notes: "",
      },
      {
        name: "Pitted Kalamata olives, halved",
        quantity: 60,
        unit: "g",
        notes: "Sub: Castelvetrano (60 g).",
      },
      {
        name: "Capers, drained",
        quantity: 2,
        unit: "tbsp",
        notes: "Rinse if very salty.",
      },
      {
        name: "Dry white wine",
        quantity: 60,
        unit: "ml",
        notes: "Sub: fish stock or water + 1 tsp lemon juice.",
      },
      {
        name: "Extra-virgin olive oil",
        quantity: 3,
        unit: "tbsp",
        notes: "",
      },
      {
        name: "Fresh oregano or thyme leaves",
        quantity: 2,
        unit: "tsp",
        notes: "Sub: 3/4 tsp dried.",
      },
      {
        name: "Red pepper flakes",
        quantity: 0.25,
        unit: "tsp",
        notes: "Optional.",
      },
      {
        name: "Lemon, sliced into rounds",
        quantity: 0.5,
        unit: "each",
        notes: "Nest under/around fish.",
      },
      {
        name: "Fresh parsley, chopped",
        quantity: 2,
        unit: "tbsp",
        notes: "",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          "Heat oven to 220°C / 425°F. Pat cod dry; season with 1/2 tsp salt and pepper.",
        duration: 120,
        timerRequired: false,
      },
      {
        stepNumber: 2,
        instruction:
          "In a large oven-safe skillet, heat 2 tbsp oil over medium-high. Add tomatoes; cook 4 minutes until blistered. Add garlic, olives, capers, oregano, red pepper; cook 1 minute. Add wine; simmer 1 minute.",
        duration: 360,
        timerRequired: true,
      },
      {
        stepNumber: 3,
        instruction:
          "Nestle cod on top; tuck lemon slices around. Drizzle remaining 1 tbsp oil; sprinkle remaining 1/2 tsp salt. Bake 12–15 minutes until fish flakes at 63°C / 145°F.",
        duration: 900,
        timerRequired: true,
      },
      {
        stepNumber: 4,
        instruction: "Rest 2 minutes. Garnish parsley; serve with pan juices.",
        duration: 120,
        timerRequired: true,
      },
    ],
  };
}

function creamyMushroomRisotto() {
  const servings = 4;
  return {
    user_id: null,
    is_public: true,
    title: "Creamy Mushroom Risotto with Parmesan and Thyme (50 minutes)",
    description:
      "Classic stovetop risotto: Arborio rice, browned mushrooms, white wine, and Parmigiano. " +
      "Keywords/subs: Arborio or carnaroli, vegetable broth (vegetarian), white wine or extra broth, Parmesan or pecorino.",
    cuisine: "Italian",
    difficulty: "intermediate",
    dietary_tags: ["vegetarian", "gluten-free"],
    prep_time: 15,
    cook_time: 35,
    total_time: 50,
    servings,
    nutrition: { calories: 480, protein: 14, carbs: 62, fat: 16 },
    ingredients: [
      {
        name: "Mixed mushrooms (cremini + shiitake), sliced",
        quantity: 450,
        unit: "g",
        notes: "Sub: all cremini.",
      },
      {
        name: "Arborio rice (uncooked)",
        quantity: 300,
        unit: "g",
        notes: "~1 1/2 cups. Sub: carnaroli.",
      },
      {
        name: "Low-sodium vegetable broth, warm",
        quantity: 1.2,
        unit: "L",
        notes: "Keep hot on low simmer. Sub: chicken broth.",
      },
      {
        name: "Dry white wine",
        quantity: 120,
        unit: "ml",
        notes: "Sub: extra broth + 1 tsp white wine vinegar.",
      },
      {
        name: "Shallots, minced",
        quantity: 2,
        unit: "each",
        notes: "Sub: 1/2 cup diced yellow onion.",
      },
      {
        name: "Garlic cloves, minced",
        quantity: 2,
        unit: "cloves",
        notes: "",
      },
      {
        name: "Unsalted butter, divided",
        quantity: 3,
        unit: "tbsp",
        notes: "Sub: olive oil for dairy-free (not as creamy).",
      },
      {
        name: "Extra-virgin olive oil",
        quantity: 1,
        unit: "tbsp",
        notes: "",
      },
      {
        name: "Fresh thyme leaves",
        quantity: 2,
        unit: "tsp",
        notes: "Sub: 3/4 tsp dried thyme.",
      },
      {
        name: "Kosher salt",
        quantity: 1,
        unit: "tsp",
        notes: "Adjust to broth saltiness.",
      },
      {
        name: "Black pepper",
        quantity: 0.5,
        unit: "tsp",
        notes: "",
      },
      {
        name: "Parmigiano-Reggiano, finely grated",
        quantity: 40,
        unit: "g",
        notes: "~1/2 cup. Sub: pecorino Romano (saltier—reduce salt).",
      },
      {
        name: "Flat-leaf parsley, chopped",
        quantity: 2,
        unit: "tbsp",
        notes: "",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          "Heat 1 tbsp butter + 1 tbsp oil in a wide Dutch oven over medium-high. Cook mushrooms 8–10 minutes until deeply browned; season pinch salt. Remove.",
        duration: 600,
        timerRequired: true,
      },
      {
        stepNumber: 2,
        instruction:
          "Reduce heat to medium. Add remaining 2 tbsp butter; sweat shallots 3 minutes. Add garlic and thyme; cook 30 seconds.",
        duration: 210,
        timerRequired: false,
      },
      {
        stepNumber: 3,
        instruction:
          "Toast rice 2 minutes, stirring. Add wine; stir until mostly absorbed.",
        duration: 180,
        timerRequired: false,
      },
      {
        stepNumber: 4,
        instruction:
          "Add warm broth 120–180 ml at a time, stirring often, letting each addition absorb before the next. 22–26 minutes until rice is creamy with slight bite.",
        duration: 1560,
        timerRequired: true,
      },
      {
        stepNumber: 5,
        instruction:
          "Fold mushrooms back in. Off heat: stir in Parmesan, salt, pepper. Rest 2 minutes. Top parsley; serve immediately.",
        duration: 120,
        timerRequired: true,
      },
    ],
  };
}

function chickpeaShawarmaBowl() {
  const servings = 4;
  return {
    user_id: null,
    is_public: true,
    title: "Chickpea Shawarma Bowl with Tahini-Yogurt Sauce and Pickles (35 minutes)",
    description:
      "Roasted spiced chickpeas, cucumber-tomato salad, and a lemony tahini-yogurt drizzle over rice or greens. " +
      "Keywords/subs: chickpeas or cauliflower, tahini or sunbutter (allergy), Greek yogurt or vegan yogurt, pita or rice.",
    cuisine: "Middle Eastern",
    difficulty: "beginner",
    dietary_tags: ["vegetarian", "gluten-free"],
    prep_time: 15,
    cook_time: 25,
    total_time: 40,
    servings,
    nutrition: { calories: 445, protein: 16, carbs: 58, fat: 18 },
    ingredients: [
      {
        name: "Canned chickpeas, drained and rinsed",
        quantity: 800,
        unit: "g",
        notes: "2 x 400 g cans. Dry well for crispness.",
      },
      {
        name: "Extra-virgin olive oil",
        quantity: 3,
        unit: "tbsp",
        notes: "",
      },
      {
        name: "Ground cumin",
        quantity: 2,
        unit: "tsp",
        notes: "",
      },
      {
        name: "Smoked paprika",
        quantity: 1,
        unit: "tsp",
        notes: "Sub: sweet paprika.",
      },
      {
        name: "Ground coriander",
        quantity: 1,
        unit: "tsp",
        notes: "",
      },
      {
        name: "Ground cinnamon",
        quantity: 0.25,
        unit: "tsp",
        notes: "Tiny warmth.",
      },
      {
        name: "Kosher salt",
        quantity: 1,
        unit: "tsp",
        notes: "Divided for chickpeas + salad.",
      },
      {
        name: "Black pepper",
        quantity: 0.5,
        unit: "tsp",
        notes: "",
      },
      {
        name: "Cucumber, diced",
        quantity: 200,
        unit: "g",
        notes: "",
      },
      {
        name: "Cherry tomatoes, halved",
        quantity: 200,
        unit: "g",
        notes: "",
      },
      {
        name: "Red onion, thinly sliced",
        quantity: 80,
        unit: "g",
        notes: "Soak in cold water 10 min to mellow (optional).",
      },
      {
        name: "Fresh lemon juice",
        quantity: 3,
        unit: "tbsp",
        notes: "Divided for salad + sauce.",
      },
      {
        name: "Cooked basmati or warm pita",
        quantity: 400,
        unit: "g",
        notes: "~4 cups rice or 4 pitas (not GF unless GF pita).",
      },
      {
        name: "Plain Greek yogurt",
        quantity: 120,
        unit: "g",
        notes: "Sub: unsweetened coconut yogurt.",
      },
      {
        name: "Tahini, well stirred",
        quantity: 2,
        unit: "tbsp",
        notes: "Sub: sunbutter (allergy); thin with water.",
      },
      {
        name: "Garlic clove, grated",
        quantity: 1,
        unit: "cloves",
        notes: "For sauce.",
      },
      {
        name: "Warm water (to thin sauce)",
        quantity: 45,
        unit: "ml",
        notes: "As needed.",
      },
      {
        name: "Pickles or pickled turnips (optional)",
        quantity: 60,
        unit: "g",
        notes: "",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          "Heat oven to 200°C / 400°F. Toss chickpeas with 2 tbsp oil, cumin, paprika, coriander, cinnamon, 3/4 tsp salt, pepper. Roast 22–25 minutes until crisp outside.",
        duration: 1500,
        timerRequired: true,
      },
      {
        stepNumber: 2,
        instruction:
          "Salad: combine cucumber, tomato, onion, 1 tbsp lemon juice, remaining 1/4 tsp salt. Toss; chill.",
        duration: 300,
        timerRequired: false,
      },
      {
        stepNumber: 3,
        instruction:
          "Sauce: whisk yogurt, tahini, garlic, 2 tbsp lemon juice; thin with water until pourable. Season.",
        duration: 180,
        timerRequired: false,
      },
      {
        stepNumber: 4,
        instruction:
          "Build bowls: rice or torn pita, roasted chickpeas, salad, drizzle sauce, pickles.",
        duration: 120,
        timerRequired: false,
      },
    ],
  };
}

function thaiRedCoconutCurryTofu() {
  const servings = 4;
  return {
    user_id: null,
    is_public: true,
    title: "Thai Red Coconut Curry with Crispy Tofu and Vegetables (35 minutes)",
    description:
      "Firm tofu cubes, red curry paste, coconut milk, bell pepper, and snap peas. " +
      "Keywords/subs: tofu or chicken thigh cubes (600 g, sear first), fish sauce or soy, Thai basil or cilantro, brown sugar or palm sugar.",
    cuisine: "Thai",
    difficulty: "beginner",
    dietary_tags: ["vegetarian", "vegan", "gluten-free", "dairy-free"],
    prep_time: 15,
    cook_time: 25,
    total_time: 40,
    servings,
    nutrition: { calories: 410, protein: 18, carbs: 18, fat: 32 },
    ingredients: [
      {
        name: "Extra-firm tofu, pressed and cubed 2 cm",
        quantity: 400,
        unit: "g",
        notes:
          "Press 15 min under weight. Sub: 600 g boneless skinless chicken thigh, 2 cm pieces (cook through to 74°C / 165°F).",
      },
      {
        name: "Cornstarch (for tofu)",
        quantity: 2,
        unit: "tbsp",
        notes: "For light crust. Omit for chicken.",
      },
      {
        name: "Neutral oil",
        quantity: 2,
        unit: "tbsp",
        notes: "Sear tofu/chicken.",
      },
      {
        name: "Thai red curry paste",
        quantity: 3,
        unit: "tbsp",
        notes: "Brands vary in heat—start with 2 tbsp if sensitive.",
      },
      {
        name: "Full-fat coconut milk",
        quantity: 800,
        unit: "ml",
        notes: "2 cans. Shake cans.",
      },
      {
        name: "Low-sodium vegetable broth",
        quantity: 120,
        unit: "ml",
        notes: "Lightens body. Sub: water.",
      },
      {
        name: "Light brown sugar",
        quantity: 2,
        unit: "tbsp",
        notes: "Sub: palm sugar grated (25 g).",
      },
      {
        name: "Fish sauce (or soy sauce for vegan)",
        quantity: 2,
        unit: "tbsp",
        notes: "Use tamari if gluten-free vegan.",
      },
      {
        name: "Lime juice",
        quantity: 2,
        unit: "tbsp",
        notes: "Finish.",
      },
      {
        name: "Red bell pepper, sliced",
        quantity: 200,
        unit: "g",
        notes: "",
      },
      {
        name: "Sugar snap peas, trimmed",
        quantity: 150,
        unit: "g",
        notes: "Sub: green beans (150 g).",
      },
      {
        name: "Baby corn (optional), drained",
        quantity: 100,
        unit: "g",
        notes: "",
      },
      {
        name: "Fresh Thai basil or cilantro",
        quantity: 20,
        unit: "g",
        notes: "Torn leaves (~1/2 cup loosely packed).",
      },
      {
        name: "Jasmine rice (uncooked)",
        quantity: 240,
        unit: "g",
        notes: "Cook separately per package (~360 ml water).",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          "Toss tofu with cornstarch to coat. Heat 2 tbsp oil in large skillet/wok on medium-high. Sear tofu 2–3 minutes per side until golden; remove.",
        duration: 360,
        timerRequired: true,
      },
      {
        stepNumber: 2,
        instruction:
          "Reduce to medium. Fry curry paste 1–2 minutes until aromatic (add splash coconut milk if sticking).",
        duration: 120,
        timerRequired: true,
      },
      {
        stepNumber: 3,
        instruction:
          "Pour in remaining coconut milk + broth + sugar + fish sauce. Simmer 5 minutes.",
        duration: 300,
        timerRequired: true,
      },
      {
        stepNumber: 4,
        instruction:
          "Add bell pepper and baby corn; simmer 4 minutes. Add snap peas; simmer 2 minutes until crisp-tender.",
        duration: 360,
        timerRequired: true,
      },
      {
        stepNumber: 5,
        instruction:
          "Return tofu; warm 1 minute. Off heat: lime juice and basil/cilantro. Serve over jasmine rice.",
        duration: 120,
        timerRequired: false,
      },
    ],
  };
}
