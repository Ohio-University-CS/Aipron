/**
 * Rowan — Assignment 09 (individual contribution)
 *
 * Five labeled test groups for pantry, recipes, and cooking API routes.
 * Each group includes a normal case, an edge case, and an error case.
 *
 * Run: npm run test --workspace backend -- unit_tests/rowan-assignment-9.test.js
 */
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.mocked(console.error).mockRestore();
});

const { mockGetUser, mockCreateUserClient } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockCreateUserClient: vi.fn(),
}));

vi.mock("../src/db/supabase.js", () => ({
  supabaseAdmin: {
    auth: {
      getUser: mockGetUser,
    },
  },
  createUserClient: mockCreateUserClient,
}));

import { cookingRouter } from "../src/routes/cooking.js";
import { pantryRouter } from "../src/routes/pantry.js";
import { recipesRouter } from "../src/routes/recipes.js";

function authHeaders() {
  return { Authorization: "Bearer test-token" };
}

function mount(router, mountPath) {
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  return app;
}

describe("Assignment 9 — pantryRouter GET / (list pantry items)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("normal case: returns 200 and a list of pantry rows from Supabase", async () => {
    const rows = [
      { id: "p1", name: "Eggs", quantity: 6, unit: "count" },
      { id: "p2", name: "Milk", quantity: 1, unit: "L" },
    ];
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: rows, error: null })),
        })),
      })),
    }));

    const app = mount(pantryRouter, "/api/pantry");
    const res = await request(app).get("/api/pantry").set(authHeaders());

    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
  });

  it("edge case: returns 200 with an empty array when the user has no items", async () => {
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));

    const app = mount(pantryRouter, "/api/pantry");
    const res = await request(app).get("/api/pantry").set(authHeaders());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("error case: returns 500 when Supabase returns an error for the query", async () => {
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: null, error: { message: "db error" } })
          ),
        })),
      })),
    }));

    const app = mount(pantryRouter, "/api/pantry");
    const res = await request(app).get("/api/pantry").set(authHeaders());

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to fetch pantry items" });
  });
});

describe("Assignment 9 — pantryRouter POST / (upsert pantry item)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("normal case: returns 201 with the saved row when name and optional fields are valid", async () => {
    const saved = {
      id: "new-id",
      user_id: "user-1",
      name: "Oats",
      quantity: 0.5,
      unit: "kg",
      expires_at: null,
    };
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(() => ({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: saved, error: null })),
          })),
        })),
      })),
    }));

    const app = mount(pantryRouter, "/api/pantry");
    const res = await request(app)
      .post("/api/pantry")
      .set(authHeaders())
      .send({ name: "Oats", quantity: 0.5, unit: "kg" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(saved);
  });

  it("edge case: accepts a minimal body with only name (optional quantity/unit omitted)", async () => {
    const saved = {
      id: "edge-id",
      user_id: "user-1",
      name: "Salt",
      quantity: null,
      unit: null,
    };
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(() => ({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: saved, error: null })),
          })),
        })),
      })),
    }));

    const app = mount(pantryRouter, "/api/pantry");
    const res = await request(app)
      .post("/api/pantry")
      .set(authHeaders())
      .send({ name: "Salt" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Salt");
  });

  it("error case: returns 400 when name is missing (validation failure)", async () => {
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(),
    }));

    const app = mount(pantryRouter, "/api/pantry");
    const res = await request(app)
      .post("/api/pantry")
      .set(authHeaders())
      .send({ quantity: 1 });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

describe("Assignment 9 — recipesRouter GET /:id (fetch recipe by id)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("normal case: returns 200 and the recipe payload when Supabase finds a row", async () => {
    const recipe = {
      id: "11111111-1111-1111-1111-111111111111",
      title: "Soup",
      servings: 4,
      ingredients: [],
      steps: [],
    };
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: recipe, error: null })),
          })),
        })),
      })),
    }));

    const app = mount(recipesRouter, "/api/recipes");
    const res = await request(app)
      .get(`/api/recipes/${recipe.id}`)
      .set(authHeaders());

    expect(res.status).toBe(200);
    expect(res.body).toEqual(recipe);
  });

  it("edge case: returns 404 when Supabase reports a row but data is null", async () => {
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    }));

    const app = mount(recipesRouter, "/api/recipes");
    const res = await request(app)
      .get("/api/recipes/22222222-2222-2222-2222-222222222222")
      .set(authHeaders());

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Recipe not found" });
  });

  it("error case: returns 404 when Supabase returns an error for the lookup", async () => {
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: null, error: { code: "PGRST116" } })
            ),
          })),
        })),
      })),
    }));

    const app = mount(recipesRouter, "/api/recipes");
    const res = await request(app)
      .get("/api/recipes/33333333-3333-3333-3333-333333333333")
      .set(authHeaders());

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Recipe not found" });
  });
});

describe("Assignment 9 — cookingRouter POST /sessions (start cooking session)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  const recipeId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

  it("normal case: returns 201 when the recipe exists and the session insert succeeds", async () => {
    const sessionRow = {
      id: "sess-1",
      user_id: "user-1",
      recipe_id: recipeId,
      current_step: 1,
      started_at: "2026-01-01T00:00:00.000Z",
      completed_at: null,
    };
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn((table) => {
        if (table === "recipes") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: recipeId }, error: null })
                ),
              })),
            })),
          };
        }
        if (table === "cooking_sessions") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: sessionRow, error: null })
                ),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    }));

    const app = mount(cookingRouter, "/api/cooking");
    const res = await request(app)
      .post("/api/cooking/sessions")
      .set(authHeaders())
      .send({ recipeId });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sessionRow);
  });

  it("edge case: returns 400 when recipeId is present but not a valid UUID", async () => {
    mockCreateUserClient.mockImplementation(() => ({ from: vi.fn() }));

    const app = mount(cookingRouter, "/api/cooking");
    const res = await request(app)
      .post("/api/cooking/sessions")
      .set(authHeaders())
      .send({ recipeId: "not-a-uuid" });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it("error case: returns 404 when the recipe does not exist", async () => {
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn((table) => {
        if (table === "recipes") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: null, error: { message: "No rows" } })
                ),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    }));

    const app = mount(cookingRouter, "/api/cooking");
    const res = await request(app)
      .post("/api/cooking/sessions")
      .set(authHeaders())
      .send({ recipeId });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Recipe not found" });
  });
});

describe("Assignment 9 — recipesRouter POST /:id/scale (scale recipe servings)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  const recipeId = "ffffffff-ffff-ffff-ffff-ffffffffffff";

  it("normal case: scales ingredient quantities and nutrition proportionally", async () => {
    const recipe = {
      id: recipeId,
      servings: 2,
      ingredients: [{ name: "flour", quantity: 1 }],
      nutrition: { calories: 100, protein: 5 },
    };
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: recipe, error: null })),
          })),
        })),
      })),
    }));

    const app = mount(recipesRouter, "/api/recipes");
    const res = await request(app)
      .post(`/api/recipes/${recipeId}/scale`)
      .set(authHeaders())
      .send({ servings: 6 });

    expect(res.status).toBe(200);
    expect(res.body.servings).toBe(6);
    expect(res.body.ingredients[0].quantity).toBe(3);
    expect(res.body.nutrition.calories).toBe(300);
    expect(res.body.nutrition.protein).toBe(15);
  });

  it("edge case: keeps nutrition null when the stored recipe has no nutrition object", async () => {
    const recipe = {
      id: recipeId,
      servings: 4,
      ingredients: [{ name: "water", quantity: 2 }],
      nutrition: null,
    };
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: recipe, error: null })),
          })),
        })),
      })),
    }));

    const app = mount(recipesRouter, "/api/recipes");
    const res = await request(app)
      .post(`/api/recipes/${recipeId}/scale`)
      .set(authHeaders())
      .send({ servings: 12 });

    expect(res.status).toBe(200);
    expect(res.body.servings).toBe(12);
    expect(res.body.ingredients[0].quantity).toBe(6);
    expect(res.body.nutrition).toBeNull();
  });

  it("error case: returns 400 when servings are outside the allowed range", async () => {
    mockCreateUserClient.mockImplementation(() => ({
      from: vi.fn(),
    }));

    const app = mount(recipesRouter, "/api/recipes");
    const res = await request(app)
      .post(`/api/recipes/${recipeId}/scale`)
      .set(authHeaders())
      .send({ servings: 99 });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
