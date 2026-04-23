/**
 * Stitch editorial photography — hot-linked from Google's Stitch CDN.
 * These are the exact images from the Stitch "Sun-Filled Brunch" designs,
 * used as placeholders/empty-state imagery until real recipe/ingredient
 * photos flow through from the backend.
 *
 * NOTE: URLs are public Google-hosted assets. If they ever rotate, swap to
 * downloaded local assets (see stitch-designs/).
 */

import { localRecipeHeroUris } from "./localRecipeHeroImages";

const base = "https://lh3.googleusercontent.com/aida-public/";

export const StitchImages = {
  // Onboarding — editorial brunch spread (marble table overhead)
  onboardingHero:
    base +
    "AB6AXuBRo0eaovSpaYNcjQ7axA5GKoCy-DsDa1hHFB5m20lguZOV8cHFOxr1D4OjkpslEB643ny6tjUsskc_X8lvp8pbvYv3sQ6fqV-qRLAKeVh7bQL0OHCgi42bGFnqnmg2Nv_mJihfwmr6yXqFedqdZb_CVomitvSyaB9xwurvY-l9CPkkfOyJ24dpvSYKKkAKlbcX0-gJ6vMmVuN3U9umiQasnBjKSY0TZTnH5P6ZcOkF_8kORAjjOK0S6vWezO0UEr49arKFZOiKDmTa",

  // Sign In — minimalist kitchen counter
  signinHero:
    base +
    "AB6AXuD4JrgzzZRTRGaRFVIDRyZPZu_vSksoQHOqP0WrCR4GZVIfnGINoRHWH3qVeT1-9Fhw3ZnabSbLOVKsbRJy3m6SwezpLN2a0mFNN7kRLA9UEz6DSF7fNyC3LX_L_vflz2tENCjJIMM6JGqGftXPZlpSP-PpWY90Ickqcxu9vmLimOtpT-goN6xfcvYIJxg6qBhB7RaDScpuC8NHmMOFqUkadHSSrHOf17X6JPbhKOQ2fZsR13CsK1Sss-4po6HHakHrQxF4lVHj8MMl",
  googleLogo:
    base +
    "AB6AXuDLshy4Nwe3EmIQfDf1Cu1227rlX9FAGzZ9VXRoq5JlgMzmSzzEDsCJN6E0ZD1zlZM5He7UUon8I1qYk7xdXojjXfE-6dKXV0jddqWEOYTYkpsfP9z8vReJODsr6UedxI-CF479jr7My3UEGffReklgoYZR_F2UdLM3YB4sfwqU8f8j2duFAB0M4N381pZFNSG7RobLlvLnPGN3ybdy-M75w0h4jRme0p6GsiJeQFWOYhIdARG-quleojvtmdiVstpSEFW6OMsL5IAb",

  // Chat / Home — AI chef's featured dish (lemon ricotta pancakes)
  chatFeaturedDish:
    base +
    "AB6AXuC96hUjV9gJkFbShh9_pKuPtZQU7MQ2rOmofVuk4evIetfPixkyPi-WzTFCkK37hLDxDgDWGBznw-a8HhQkF9-J0Vm1rmvP59qUz2CIbTNRLcVGwqjHxCkj6Kv3w9vui5L2pEpxg3tYkikslqt9gkdDj94005r3VnX9LOWOtHljB0lOMrSU_7XujMiWs0vrdQXJC4m7yWENuCYkVXJL0vNb8binrSI0M2Q4IXqV7DsC68y8hiJmfIG045aWzxPWY7UbfZ1Byyu6Zjlz",
  chatChefAvatar:
    base +
    "AB6AXuAPajJBdVZNuaq0Pb2ibqfIRI5rIYPtRZBzfHkrOYg6sUS54kipimzdNgsPOxpAaBJut43dDE0M8WK4_mjKKv1j5_95mGt18tRqdvPv3005H_9UqkGs-8wGJhGDwqbjcM-1MU2fald2kkfmVyOJ-Cr4JjOC6oGLzTSEY6CmIJ_sMPIEVOWxqc-Ie0a3Sv5XDXbDg-fzOaex2yrzOlnWktGMMxpbnWUd9wzYzyEzktywCxn5jwluuQcbLL07yYTqs_qFhmm9J083jK0w",

  // Pantry
  pantryAvatar:
    base +
    "AB6AXuDBgKgzv4kAFaOOx4-ACeL2wKp4i_fmYoDqkfb6UGrm_oeUHpyeZdlYIPo3VO9vr4cIvDFvY6kAo7LWslc6HM8OhHB3qlXyVdc286a9W_uTSBHCLVb8XKHNJpdqkkTzry168Njr0Lb_9n-mjHCSdUJWhr_yIeANEmIUsq2tQmtojjLP8xbCm7deQaWHHVKKUVGr70zFnuQj5tSXvSt1XCErDinXpxA_tlJgzwH51NpJb084mUNneWtO776gKsqFTOIThBmp9cp4Woak",
  pantryLemonRicottaDish:
    base +
    "AB6AXuDWvb8qMabxowLn0pCnxcBNG8KEYomevMTKl10B3EiwKtESlBtHu_3Kj4ZMTXE9DnqDgFG2T2BYmImhy3fzHGW6slJuXce4eBpioyYkiJejR3UYy7XVdux3dSZb_axUl23AIJDJx7QQoM8TmgtbzbYkW2n_61dAxKzAlADz1cR22HLVDAOevFr2lBAm7EmmFsZNlnpfUE_lF6MSIrZu41JvrRAss3gdPF5Cfm2ZGbUJX8qOt2Vc1ODW4YTh6AduLnNf8qLQSNrW4nim",
  pantryHeroLemons:
    base +
    "AB6AXuBTJ1x3JM8Cp7syM1C83NCrOP8108gpZtfM_cEnx1qhSJozejchzGsmF2LnP1xi6Jg-KOtzqcO36wELqYG-yrwhx2IutZZvkFfPE6taC0OSAfh3ai0S87Hi6DYzRyZR4FmoipNic6UlvvIXPVkS9YMBLlOpw5T_C5eimPVhOB4Q82CoAnNefFe-3Ve-BviRf7RBR0BzoJch1e9NOZEv4TXzdGywYi6QlYMb4bjmSu1Omy0LHeSqr2vqPSue4fqci9uGu49rIe45IPyf",
  pantryRicottaBowl:
    base +
    "AB6AXuBCnqxDzO5qGCmWx1nevUkwtwJ-Q9bc4STX0pHs9r8Uuq6-H6UbZDK_7_1fqRv2v7_XLWogZpDDT728k2eFXgABJrk1DsEaN6i-RHIc138S9xiDV8vwPtYZmF_m5q_OaHDULjwt0GtskBqugmnj44MlKVBiEVbb9ayLoR18Y5OZMwxVmYNSH8dEjve4lSQdP_IXGcjJYIjR3hp2NLCXF6hYRonwgikRC9jV5w0lCGqkA8As6TZawsLlkGfcPYykIUO3MuVqQyoNKfZV",
  pantryLemonsBowl:
    base +
    "AB6AXuCCTIZmHcwUwi_1SNSDIOub-omSV44ZEg9GToy4papDwSyOhtb98DdN_GZ5AK9gg9Nfns1mDg8FTFDQgMAytWVyj1AhJWFt3y9iupo_cHObID3UC7Pc5FIGek9sLOTzBkZ3rAj9n7nV5BYT_43PVpgDpyrGeXI848eXubn_gI9GcjUPcc_16VOrZ6i6EwidDFbBgV2wrJS3tcYaOigdlr9FOEE_fX3L_yif4HdwW-wPdFj_bYSWc_VskeKw0UujFi3dVnCTgDH_MObU",

  // Discover / Search — editorial recipe grid
  discoverAvatar:
    base +
    "AB6AXuDEk2QcfoMz6M56Zr1dZHbuZmEdJOVzI7LiXcgSBhCK-Ek5SpdhSQuRBAn0BeGkUTEJku_K40HZS5wYdSjbMUFbpisCPz5OnANCo07uWD0p_4IK3AbIVCuPwkMH4mRk8CkdrIb3V2_maOSaTI7O7EzjFH_K0OvJWbk4O2TFuB6TIt2qP1yyyRFRYg4qZn8qj6bgjZLRczhUp9mwigX-WL_uh2klXvlu5I3DKmkxKWVKcB6_I30d7sCV_fzWElSfnJ6EAZjEjSbk1_b6",
  discoverHeroBowl:
    base +
    "AB6AXuCP8Mqc_yVBls3rvJz8Se-W2-AW54zy5f4nStc4QsbYt7V_kh6GDsVMYgnAaIpcYvIPRNousQ_VF-yBKWi8p7NBYegHurHmer99huvSa4Z5MkTCiXdQgfxXdGuIuq6RjtD2xB_C_swz1u1F_8BZbAOzA2eehFxgTnipMgjlP3LK3NaeSa0RkfOAOdn-DnwSvXEeefKgiC4rhheKcUZmu2eglH8fmmIuPFUQK5x7ahEr0eEZpsW4Pm97z2fOrolSTT7wbNbknf_zhODf",
  discoverBurrata:
    base +
    "AB6AXuBODYRc58BeVCuQcjKg1HkL2ivC2Dvp_K7xSohTnydrC1SksR4OHodu2H_KXf9Lz494YBGIVcv2xXLzCPwERXoO0boH9VqKmyfSvdgiVTipXrqLWpIyQqXmEOXylfQyPsB4kmeH5UxPwzz5BVLvYArOhOLjt_pArFqw3ha5QP9uplZXGk2rxxvY7DRruizSLg1Z49kHwV2sL3ZmRrAODgw3YC4cAy5KeCtc7mfzKQhNM5ERyeU7M4IJaUwQiE04A1NzQWQQrt-f66Mg",
  discoverFettuccine:
    base +
    "AB6AXuAd3fi1kTDjYJhYSdmrPdRteYB6mkBwGLDr335J87jx1N3i76d0t2I-aDHkwG4N1qYTmh7__W8V93fRERf_uRmVD9s6rjNbRSxmITW47FlChi_sTIJN9Eq0KwGZmOWEkuIW7wYFFlgZvfbaQkliCaMvR2ogH2_a10uK3Dh52aMDZwu72kOeSbgxIuvr1QzqBEXrWbNFsRXVYWKgyCJY__LaI6jaDZyAWyve8_bFe9ol_Psid1t-673hjc-hFPI8m2ox_K29agW63fAk",
  discoverTartine:
    base +
    "AB6AXuDPQ3cvAFtFsBug9Qwz39VrLPaePikBDMi6Pn-ce1-dfM9gxuTaVRwSDSOmv1Oo5mmW6_11i5n128cUt8cjy2tnbHkwEngpEg0iX202PB5DUU78Qh-Pv5pF0U3sO6abio_fs9f5VNprVZSFISwtkKRxZX3aAU2Wfwp1Z1crt-Nzct_Vx2ql8pE1zp_c5y-IweT3XnP9tT1wKJzGVHDBQpTl9LbZnQN7-3ylW4YMopJZ-dQYqZw7L3_WS9Qv7hVhyFQnCudnKTjp4yWc",
  discoverSalmon:
    base +
    "AB6AXuC7ED_onlyESp89V4yhkqqTnrDp4kNX7u9sCqXFMX3qyzSLbDdxlIEPI2FI6YBdCMGH6P8_jkxqkuGMx9rRJ3-7y7KtJNz_JdTcbL3ApQfx0aref0BPH95Fr7hPToTwT09qtnhapmOKg8QGAg2cBlM4ByxtyBz1L2CliZBrjzeCdLPUNnL2_FnGRFVOkbsr4irwFt3Uk0_QMqhsqNm5KlD7Kcg-D1cH6MdEANIjXJp3GjYZ0n0MIHayrilBHx-vg5I4Z0mJwlS9qPsV",

  // Favorites
  favoritesAvatar:
    base +
    "AB6AXuBckzPrHiLjfzS3whHFwXnM1AwAD22Gye-k1B1kEvNVrPwOwJVrOufgmhFt7ye_3XogCn3hichfQ8lZfx95yJs-6GZaVdKkZuqXKvG5LRPpZ1Gp5Rg8dqIWOZ7nUZ7eY45iXnx1jnhkSFJu20WjhISiwd51IpYwqmIyZgMGJBGKS7SJPJY21cQQ8FhDeNKOAyCgGF7_6MCsC1fS0ESM6mCJsTuaCF2SJpeSs2TnHyvsVWP4d2xqdgWNQzTVwdd0j2BVQPI9IAd20eJt",
  favoritesCitrusSalad:
    base +
    "AB6AXuA7VBKFaS43ERLi78Zsiwv9fhjLhAbtcmEaPlNaNefb4X9D8A5dErIplsOdpJx4KlzYcyzRv5e0wXNN-grgWVOMv0EpDC-pdsW8ujmf3eAnTbsKfBvqoQsO9Rj4Y00scIuuRonAliNytzYJlYLKGskm3XWj2_fw0MGSQQuiGRnYp2O8SgQUU6BGT0TKAI0GsvpIRbEtI-4ZJWWth7W0uSkCLUFV0uwWw_Mr1ex8TqDwi855KXyDPvwY-c24LFSwmoC2YdK5miIa21dp",
  favoritesPizza:
    base +
    "AB6AXuAqAKnY8fx9AKgcCUi9gdr9V1jO-pt3lX9uHtALN4cepuSwlWOJQ9sSyNB4zwExcF9UOSaJc_bvBsvL-sM-pPpO8u3ra423hSMmOe7MHiCyo44hVWXJVWfbVTDWKz3CmAQfx8GwHF9WRXaAq73tazr-ksBJqJ5WuxonlAahsXTA0uh5jISzJio5LCANg5YeAFLpPc9i5Oc-X_vGBR_2aFT7MNjdhySBrbOEQSFTzNCWszv01jWyxLSJrtIT-EfMmb4bmcv1vLhvcVGd",
  favoritesGrainBowl:
    base +
    "AB6AXuBoNTBfnEXAiM9jLVxhqxZzHkI2HEDhpqBB-yAsVr9yLX_kwgxhJnPpQUw8IqWzCYepI6eQBmfc5dnbt9drmOhAXQ2DI7IZ42RwpCv429KkW6vtyRSfKOa03KoSWg4BmNnufNnlgtvU2R1ZUL8Mvw4ACWo-vHmpGiE5GiLufa8VUwtJZ6RqxmswsrGk8U4qmpgVB4-sTlkrLBzaMIA-d2qzRmN0qULWI4jJbrqafTC0LoJ0fjt0n2RZjNbIy-b5WJaYgoPgr5V4iaKP",
  favoritesDonuts:
    base +
    "AB6AXuAwO2jOzXhx0Pg2OBmO5v8vyAoHp-ZEQP2FiO-o94laCv8mp2-BodskFXpPlCIZFtVc-zbN6bg5avGWwsRxxjRO2rRiVUwtpGiv-1mt9v6ujD1A_86tBf6fLQxPKceG63htU6pfKsTvLjnrnv6TteGszYWG6Zm8YErK_Stcz3HTgSSIdTdgwBtxKyRlktzAeiyXxQmCiUaT87iGSBwbWZ5wLJ5dgKxdslptv5Chx5hn7N_YSL9S1K-Dr-XtgrL-S3o1EA2gTh7c8ARN",
  favoritesPasta:
    base +
    "AB6AXuD2_7tlSQurK8XPWJDHNmzRE9iXpmAgVmYnf4uJn927ljg1kDv6xN8jaOXj3NzL-r6VF6zTlvz043L2MJ_qQ5QEHkfYSUaXZfdZPIzMtKbrRNj2oRLd_aF3EcHiKdZLhHVwF0WPTRw19B1_PpN37pqrtzpfc4W4pMMn9NXMh5ec8myvbaMlJUqPSzXusOV2iw3MQu8Ba7CdzufvTCQOwN3ZX_yc1Y9RvmtDfbeaUwFf4-bw9T4-ROHhsdpR-m-0rLhcBMlFeuMP17sm",

  // Profile
  profileAvatarHeader:
    base +
    "AB6AXuA3_Ujfyl2SNkPA5frVUEymzCQ-6k5YwYKmQNJFEDSQWYXarUcKE6jnMSDkAA4rIhxIpyF16YF1tPTQnm7pvodFQQKkvVg8v9cPsXko7VU0o2hU_tDJ3zNX6VHeqwZc6h9ifWDvzMImMEZPIVjZIzRuukwfRyHIN2IekpnMxxvfQ7AxFlBG1nlSTczddDS2Onc3V-KZe2DDPBohbykgayEm4QuaSgpCNBsXJ_PwqGM8skAdxFvu8uha1PubAIHnry6OQAmsikFL1ro7",
  profileHero:
    base +
    "AB6AXuCsniGTaPuHow29snoYl_5yQg7k0g1xngzuRZVd6cA2SeA7Yixdaf9Sw6s6CQ4zeq0ZPuIIKLEqIjnaVZrwYps7veRuEnjX4nAIzRt4BY1B233h4iokWSHRa0kGdQH61zEmiY7-LE6FeYTdI0cA5_Ul6_8u5GLf8oNQdyRN95tG6x8E7lTmyhH7Eo_SdxxagLwQGTuIvNhtRxkFt-ZRMRLt3baXFtXvrv1NUBwgOeXlGEkKehc1sJ1m4aOPJh1ZkQkP7zvjm-sn1tnq",

  // Cooking Mode
  cookingAvatar:
    base +
    "AB6AXuCQO_l-DStYpp965ICPaKApWLsOvezHW6YezRJhn4_smpeCZLPu77yKNg1trRcTWPKeFY1oJmAaqRvFC7F5ol4OTOsEbcss0UzcF2APvGDF-Q2Dp45CGWaCmIOG7RPhcRR18DGD934p98Pc30T6I_pKA0-McHYmsXZfyp6HrZZoLQX_w9YV6QPqPgBcRXXh09RqnM_Ybg58uTaC2NH0NaeD3ojdHYQF-6_4HX8WJLe03eAxt20o8TXm5WXm13UL9oGszXygsdJ802P7",
  cookingStepHero:
    base +
    "AB6AXuD1BhoirRdgA4pqQxpBj7lCN02IfO0AsX1sZwe8d4Ljs4rpbvw_NIzG0WCxL7nSWMtTBrxMrDrDJ5AXgFxrmKzCj1P0UrakRBKWjnWaBWh1SPvvXMiYgLPHLSGh2ki4OKaI3mcU1HGUh0FheDf3yXzcJ7IRy98ZYR2GiHjZ98ldspQtRIrjva1D74JJMsSSyq3u3JjylnKWN8Aw_hFcwuPYLDSp2Yj4thxcB0_Du9XYipnziurYdnyOusAhyCVHAvz1VtnTqeoYsT-C",

  // Settings
  settingsHeroPortrait:
    base +
    "AB6AXuDYj1v2qIRZhCc9vDbtws82Pqvmfaiy48cXd3czTg5Ym509Ps4pz4QzJSBJYhRs15NOIJ94sggOxMUn5G_TCMmxq6GwTDWd3s5Mqc10SvQoCl2KrlCxxnzMg1g5HnSLEKNKTHfOIi3LWimVxve2EXNnOutxSzdtE-OKy1kUyEOW_D4FmNA0uWZH9A1p1P8bQAMjWkT5r9jMi1L9BSlm9edl2NfhtLikKuvPrqdRtlTZQ7t-wrsZ_Ngtshkcs3lJQytMVAgFE89hPyeK",
  settingsAvatar:
    base +
    "AB6AXuCBT-kBJAMyiRi9y3WAjQSwaA_4gQ7gzK-hSzCPRLEaI7kdTJALQpOoeUJRa9_7tZRFrnTJUCO0NSZbY2JFcX1obywcoPVbX1d1-rHvRlc8QL4JlqmJCpS_vpECUHsqJ2GXSamLvh7BLjNMH0vyXadLhA0SuIoF6udvIFAm4E6PBz8Zt3BIbxseJY0bLHSP3D-K9pVRkEkrQkJxBdUaYHgODotymJ7cLXkAmILOGfA93IvA_1L9-4OcVwKWU3DXMhT0gFkpPr8B_d5N",

  // Recipe Detail — lemon ricotta pancakes hero
  recipeDetailHero:
    base +
    "AB6AXuBGnB0bmWFcA2QY8kKksdMiuXmx_J6HOYI9KswrePg70f04vYZsDevpoFwuTpAx3FFcVxQK03wjYk3xwdIrjeVbDptUyzVVz05r3ESgxDyw7n9K5Q7uvhT1x-4XT1IPzBqTsqCA0lMnJ1ZKvXe_awLLvzGSQzLx97e9eVuIT4660dDLbpghto0QpJL3w9XcX0qYjyqzaIeePLj2AivqrCuezreGjHCtc0vZ6LGxx6VEF2hZd34QW05gqJ5ZinN6XOuQfccp_d7ErIjb",
} as const;

/**
 * Unsplash (free) — not part of the Stitch set; use when we need a category we don’t have editorial for (e.g. layer cake) so
 * a dessert never hashes onto a “bowl of pasta” or chicken image.
 * Verified: HTTP 200 with `w=1200`.
 */
export const UnsplashCategoryHeroes = {
  /** Layered cake / party cake — for baking, desserts, celebratory bakes */
  layerCake:
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop",
  /** Poultry mains — baked-in asset (see `localRecipeHeroImages.ts`) */
  chickenMain: localRecipeHeroUris.chickenMain,
  /** Wok / stir-fry */
  wokVeggies:
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&auto=format&fit=crop",
  /** Generic beautiful plated meal (hash tie-break) */
  platedMeal:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop",
} as const;

/** Fallback food photos cycle through these when heroImage is not provided. */
export const fallbackFoodPhotos = [
  UnsplashCategoryHeroes.layerCake,
  StitchImages.discoverHeroBowl,
  StitchImages.discoverBurrata,
  StitchImages.discoverFettuccine,
  StitchImages.discoverTartine,
  StitchImages.discoverSalmon,
  StitchImages.favoritesCitrusSalad,
  StitchImages.favoritesPizza,
  StitchImages.favoritesGrainBowl,
  StitchImages.favoritesDonuts,
  StitchImages.favoritesPasta,
  localRecipeHeroUris.pancakes,
  StitchImages.pantryLemonRicottaDish,
  UnsplashCategoryHeroes.chickenMain,
] as const;

/** Build text for keyword + hash fallback when `heroImage` is missing. Include ingredients so “cake”/“salmon” win over a random hash. */
export function recipeImageFallbackSeed(recipe: {
  title?: string;
  id?: string;
  cuisine?: string;
  description?: string;
  ingredients?: unknown;
  steps?: unknown;
}): string {
  const r = recipe as Record<string, unknown>;
  const title = pickStr(recipe.title, r.title);
  const cuisine = pickStr(recipe.cuisine, r.cuisine);
  const description = pickStr(recipe.description, r.description);
  const id = pickStr(recipe.id, r.id);

  const rawIng = recipe.ingredients ?? r.ingredients;
  const ingLines: string[] = [];
  if (Array.isArray(rawIng)) {
    for (const item of rawIng) {
      if (typeof item === "string" && item.trim()) {
        ingLines.push(item);
        continue;
      }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const line = [o.name, o.ingredient, o.item, o.Name, o.Ingredient].find(
          (x): x is string => typeof x === "string" && x.length > 0,
        );
        if (line) ingLines.push(line);
      }
    }
  }
  const ing = ingLines.join(" ");

  const rawSteps = recipe.steps ?? r.steps;
  let stepBlob = "";
  if (Array.isArray(rawSteps)) {
    stepBlob = rawSteps
      .map((s) => {
        if (!s || typeof s !== "object") return "";
        const o = s as Record<string, unknown>;
        const line = [o.instruction, o.Instruction].find(
          (x) => typeof x === "string" && x.length > 0,
        );
        return line ?? "";
      })
      .join(" ");
  }

  return [title, cuisine, description, ing, stepBlob, id]
    .filter((s) => s.length > 0)
    .join(" ");
}

function pickStr(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return "";
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Remove chicken broth/stock phrases so a main that lists both breast and broth still reads as poultry. */
function stripChickenBrothPhrases(s: string): string {
  return s
    .replace(/\b(?:low[- ]sodium )?chicken (stock|broth|bone broth|base|powder|bouillon|concentrate)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mentionsChickenProtein(h: string): boolean {
  const r = stripChickenBrothPhrases(h).toLowerCase();
  return (
    r.includes("chicken") ||
    r.includes("cornish hen") ||
    (r.includes("drumstick") && !h.includes("ice cream")) ||
    r.includes(" chicken ")
  );
}

/**
 * Map title + ingredients text to a thematic photo. **Order matters** — desserts and baking
 * must run before any generic "bowl" or "chicken" heuristics so a chocolate cake is never
 * paired with a stock chicken shot.
 */
type KeywordRule = {
  keys: string[];
  image: string;
  /** Match with word boundaries only (avoids “icing” in “dicing”, “flan” in “flank”, “crumble” in “crumbled”). */
  wholeWordKeys?: string[];
};

function pickKeywordFoodPhoto(haystack: string): string | null {
  const h = haystack.toLowerCase();
  const rules: KeywordRule[] = [
    {
      keys: [
        "chocolate cake",
        "birthday cake",
        "wedding cake",
        "sponge cake",
        "pound cake",
        "red velvet",
        "carrot cake",
        " layer cake",
        "cupcake",
        " bundt",
        " coffee cake",
        " angel food",
        " sheet cake",
        "gateau",
        "gâteau",
        "chocolate souffle",
        "chocolate soufflé",
        "raspberry souffle",
        "lemon souffle",
        "mango souffle",
        "dessert souffle",
        "dessert soufflé",
      ],
      image: UnsplashCategoryHeroes.layerCake,
    },
    {
      keys: ["cheese soufflé", "cheese souffle", "souffle aux", "savory souffle"],
      image: StitchImages.discoverHeroBowl,
    },
    // Breakfast before the broad “sweet bakery” block — otherwise “baking powder” / “muffin” / “cinnamon roll”
    // in pancakes, waffles, or english muffins incorrectly maps to the layer-cake hero.
    {
      keys: ["pancake", "waffle", "french toast", "cinnamon roll", "cinnamon bun"],
      image: localRecipeHeroUris.pancakes,
    },
    {
      keys: [
        "cheesecake",
        "frosting",
        "buttercream",
        "butter cream",
        "ganache",
        "buttercream",
        "eclair",
        "éclair",
        "cannoli",
        "mousse",
        "tiramisu",
        "panna cotta",
        "pudding",
        "creme brulee",
        "crème brûlée",
        "pavlova",
        "trifle",
        "parfait",
        "sorbet",
        "gelato",
        "fudge",
        "blondie",
        "biscotti",
        "scone",
        " danish",
        "croissant",
        "dessert",
        "pastry cream",
        "choux",
        "babka",
        "cake pop",
        "churro",
        "macaron",
        "meringue",
        "funnel cake",
        "cobbler",
        "apple crisp",
        "fruit crisp",
        "berry crisp",
        "peach crisp",
        "pear crisp",
        "rhubarb crisp",
        "pie crust",
        "pumpkin pie",
        "pecan pie",
        "key lime",
        "apple pie",
        "cherry pie",
        "apple galette",
        "peach galette",
        "berry galette",
        "fruit galette",
        "cookie",
        "brownie",
        "shortbread",
        "sugar cookie",
        "chocolate chip",
        "oreo",
      ],
      wholeWordKeys: ["icing", "flan", "crumble"],
      image: h.includes("donut") || h.includes("doughnut")
        ? StitchImages.favoritesDonuts
        : UnsplashCategoryHeroes.layerCake,
    },
    {
      keys: ["burrata", "caprese"],
      image: StitchImages.discoverBurrata,
    },
    {
      keys: ["pizza", "flatbread", "margherita", "pepperoni", "calzone", "stromboli", "focaccia"],
      image: StitchImages.favoritesPizza,
    },
    {
      keys: [
        "fettuccine",
        "spaghetti",
        "pasta",
        "linguine",
        "penne",
        "gnocchi",
        "ravioli",
        "lasagna",
        "carbonara",
        "orzo",
        "tagliatelle",
        "bucatini",
        "rigatoni",
        "cacio e pepe",
        "pesto",
        "vodka sauce",
        "bolognese",
      ],
      image: StitchImages.discoverFettuccine,
    },
    {
      keys: [
        "salmon",
        "trout",
        "steelhead",
        "arctic char",
        "cod",
        "halibut",
        "tilapia",
        "sea bass",
        "branzino",
        "mahi",
        "tuna",
        "swordfish",
        "snapper",
        "octopus",
        "calamari",
        "shrimp",
        "scallop",
        "prawn",
        "lobster",
        "mussel",
        "clam",
        "ceviche",
        "poke",
        "sushi",
        "nigiri",
        "maki",
        "sashimi",
        "fish taco",
        "gravadlax",
        "lox",
      ],
      image: StitchImages.discoverSalmon,
    },
    {
      keys: ["risotto", "arborio", "mushroom risotto", "milanese"],
      image: StitchImages.favoritesGrainBowl,
    },
    {
      keys: [
        "citrus salad",
        "greek salad",
        "caesar salad",
        "cobb salad",
        "garden salad",
        "arugula salad",
        "spinach salad",
        "caprese salad",
        "kale salad",
        "fattoush",
        "tabouli",
        "tabbouleh",
        "macedoine",
      ],
      image: StitchImages.favoritesCitrusSalad,
    },
    {
      keys: ["donut", "doughnut"],
      image: StitchImages.favoritesDonuts,
    },
    {
      keys: [
        "tartine",
        "bruschetta",
        "crostini",
        "open-faced",
        "fruit tart",
        "lemon tart",
        "savory tart",
        "caramelized onion tart",
        "french onion tart",
        "french galette",
        "mushroom galette",
      ],
      image: StitchImages.discoverTartine,
    },
    {
      keys: [
        "shawarma",
        "falafel",
        "kebab",
        "kofte",
        "fattoush",
        "hummus",
        "mezze",
        "grain bowl",
        "buddha bowl",
        "quinoa bowl",
        "buddha",
      ],
      image: StitchImages.favoritesGrainBowl,
    },
    {
      keys: ["chickpea", "ceci", "hummus", "falafel", "baba ghanouj", "baba ghanoush", "foul"],
      image: StitchImages.favoritesGrainBowl,
    },
    {
      keys: ["biryani", "dal", "dahl", "dhal", "lentil", "urad", "chana", "garam masala", "dosa", "idli", "samos"],
      image: StitchImages.discoverHeroBowl,
    },
    {
      keys: ["stir-fry", "stir fry", "wok", "kung pao", "kungpao", "moo shu", "chop suey", "pad kee", "yakisoba", "yaki udon", "teriyaki", "hunan", "szech", "sichuan", "korean bbq", "gochujang", "miso glaze"],
      image: UnsplashCategoryHeroes.wokVeggies,
    },
    {
      keys: [
        "curry",
        "coconut curry",
        "thai red",
        "thai green",
        "massaman",
        "panang",
        "vindaloo",
        "korma",
        "jalfrezi",
        "tikka masala",
        "gaeng",
        "pho",
        "ramen",
        "laksa",
        "miso soup",
        "miso",
        "hot pot",
        "shabu",
        "bibimbap",
        "dumpling",
        "gyoza",
        "potsticker",
        "dim sum",
        "banh mi",
        "spring roll",
        "summer roll",
      ],
      image: StitchImages.discoverHeroBowl,
    },
    {
      keys: [
        "soup",
        "stew",
        "gumbo",
        "jambalaya",
        "chili con",
        "chili",
        "chowder",
        "bisque",
        "gazpacho",
        "borscht",
        "goulash",
        "cassoulet",
        "ratatouille",
        "pot roast",
        "stuffed pepper",
        "moussaka",
      ],
      image: StitchImages.discoverHeroBowl,
    },
    {
      keys: ["beef", "steak", "brisket", "short rib", "prime rib", "pulled pork", "carnitas", "chorizo", "bacon", "pork ", "lamb", "lambchop", "lamb ", "mutton", "ribeye", "sirloin", "tenderloin", "burger", "meatloaf", "bolognese", "cottage pie", "sloppy", "bangers", "kielbasa", "schnitzel", "cordon bleu", "cabbage roll"],
      image: h.includes("stir") || h.includes("wok") || h.includes("stir-fry")
        ? UnsplashCategoryHeroes.wokVeggies
        : UnsplashCategoryHeroes.platedMeal,
    },
    {
      keys: [
        "frittata",
        "omelette",
        "omelet",
        "quiche",
        "strata",
        "shakshuka",
        "benedict",
        "scramble",
        "egg in",
        "chilaquiles",
        "huevos",
        "coddled",
      ],
      image: StitchImages.chatFeaturedDish,
    },
    {
      keys: [
        "tofu",
        "tempeh",
        "seitan",
        "plant-based",
        "vegan",
        "jackfruit",
        "impossible",
        " beyond ",
      ],
      image: StitchImages.discoverHeroBowl,
    },
    {
      keys: ["mushroom", "porcini", "shiitake", "maitake", "cremini", "fungi"],
      image: StitchImages.favoritesGrainBowl,
    },
  ];

  for (const { keys, image, wholeWordKeys } of rules) {
    if (keys.some((k) => h.includes(k))) return image;
    if (
      wholeWordKeys?.some((w) =>
        new RegExp(`\\b${escapeRegExp(w.toLowerCase())}\\b`).test(h),
      )
    ) {
      return image;
    }
  }

  if (mentionsChickenProtein(h) || h.includes("turkey") || h.includes("duck") || h.includes("goose") || h.includes(" game hen")) {
    return UnsplashCategoryHeroes.chickenMain;
  }
  if (h.includes("one-pot") || h.includes("one pot") || h.includes("sheet pan") || h.includes("sheet-pan") || h.includes("skillet ")) {
    return StitchImages.discoverHeroBowl;
  }

  return null;
}

/** Fallback when heroImage is missing: prefer keyword match on id/title, then a stable hash. */
export function pickFallbackPhoto(seed?: string): string {
  // Avoid defaulting to layerCake ([0]) when the seed is missing — reads as “everything is chocolate cake”.
  if (!seed) return UnsplashCategoryHeroes.platedMeal;
  const keyword = pickKeywordFoodPhoto(seed);
  if (keyword) return keyword;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return fallbackFoodPhotos[hash % fallbackFoodPhotos.length];
}
