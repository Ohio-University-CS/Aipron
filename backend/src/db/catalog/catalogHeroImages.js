/**
 * Public hero image URLs for each catalog recipe title (client-only; not a DB column).
 * Used by mobile/scripts/generate-local-catalog.mjs to set `heroImage` on the local PWA cache.
 * Mix of Stitch editorial CDN + Unsplash (verified HTTP 200) for proteins not covered in Stitch.
 */

const stitch =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC7ED_onlyESp89V4yhkqqTnrDp4kNX7u9sCqXFMX3qyzSLbDdxlIEPI2FI6YBdCMGH6P8_jkxqkuGMx9rRJ3-7y7KtJNz_JdTcbL3ApQfx0aref0BPH95Fr7hPToTwT09qtnhapmOKg8QGAg2cBlM4ByxtyBz1L2CliZBrjzeCdLPUNnL2_FnGRFVOkbsr4irwFt3Uk0_QMqhsqNm5KlD7Kcg-D1cH6MdEANIjXJp3GjYZ0n0MIHayrilBHx-vg5I4Z0mJwlS9qPsV";
const bowl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCP8Mqc_yVBls3rvJz8Se-W2-AW54zy5f4nStc4QsbYt7V_kh6GDsVMYgnAaIpcYvIPRNousQ_VF-yBKWi8p7NBYegHurHmer99huvSa4Z5MkTCiXdQgfxXdGuIuq6RjtD2xB_C_swz1u1F_8BZbAOzA2eehFxgTnipMgjlP3LK3NaeSa0RkfOAOdn-DnwSvXEeefKgiC4rhheKcUZmu2eglH8fmmIuPFUQK5x7ahEr0eEZpsW4Pm97z2fOrolSTT7wbNbknf_zhODf";
const grainBowl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBoNTBfnEXAiM9jLVxhqxZzHkI2HEDhpqBB-yAsVr9yLX_kwgxhJnPpQUw8IqWzCYepI6eQBmfc5dnbt9drmOhAXQ2DI7IZ42RwpCv429KkW6vtyRSfKOa03KoSWg4BmNnufNnlgtvU2R1ZUL8Mvw4ACWo-vHmpGiE5GiLufa8VUwtJZ6RqxmswsrGk8U4qmpgVB4-sTlkrLBzaMIA-d2qzRmN0qULWI4jJbrqafTC0LoJ0fjt0n2RZjNbIy-b5WJaYgoPgr5V4iaKP";
// Unsplash: roasted chicken in pan (relevant for one-pot chicken & rice; not a soup bowl)
const chickenDish =
  "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1200&auto=format&fit=crop";
// Unsplash: stir-fry / wok-style vegetables (beef & broccoli)
const wokStirFry =
  "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&auto=format&fit=crop";
// Unsplash: roasted fish (white fish / coastal — closer to cod than salmon-only editorial)
const bakedFishPlatter =
  "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&auto=format&fit=crop";
// Unsplash: big colorful bowl (shawarma / grain bowl)
const middleEasternBowl =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop";
// Thai red curry: match the warm curry-bowl look from the Stitch set
const thaiStyleBowl = bowl;

/* eslint-disable max-len */
export const CATALOG_HERO_IMAGES = {
  "Crispy-Skinned Salmon with Lemon-Dill Yogurt Sauce + Garlicky Green Beans (30 minutes)": stitch,
  "One-Pot Lemon-Herb Chicken Thighs with Rice (45 minutes)": chickenDish,
  "Red Lentil Dal with Tempered Spices + Basmati Rice (40 minutes)": bowl,
  "Beef and Broccoli Stir-Fry with Garlic-Ginger Sauce (25 minutes)": wokStirFry,
  "Baked Cod with Burst Tomatoes, Olives, and Capers (35 minutes)": bakedFishPlatter,
  "Creamy Mushroom Risotto with Parmesan and Thyme (50 minutes)": grainBowl,
  "Chickpea Shawarma Bowl with Tahini-Yogurt Sauce and Pickles (35 minutes)": middleEasternBowl,
  "Thai Red Coconut Curry with Crispy Tofu and Vegetables (35 minutes)": thaiStyleBowl,
};
