// run it with npm run test --workspace backend
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.mocked(console.error).mockRestore();
});

const { mockGetUser, mockCreateUserClient, openaiCreateMock } = vi.hoisted(
  () => ({
    mockGetUser: vi.fn(),
    mockCreateUserClient: vi.fn(),
    openaiCreateMock: vi.fn(),
  })
);

vi.mock("../src/db/supabase.js", () => ({
  supabaseAdmin: {
    auth: {
      getUser: mockGetUser,
    },
  },
  createUserClient: mockCreateUserClient,
}));

vi.mock("openai", () => ({
  default: vi.fn(function OpenAIMock() {
    return {
      chat: {
        completions: {
          create: openaiCreateMock,
        },
      },
    };
  }),
}));

import { authenticateToken } from "../src/middleware/auth.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import {
  findPantryRecipes,
  generateRecipe,
  getSubstitutions,
} from "../src/services/openai.js";

function createMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("authenticateToken middleware (additional coverage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normal case: accepts lowercase bearer prefix and sets request context", async () => {
    const req = { headers: { authorization: "bearer valid-token" } };
    const res = createMockRes();
    const next = vi.fn();
    const fakeUser = { id: "u-2", email: "test@example.com" };
    const fakeClient = { from: vi.fn() };

    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockCreateUserClient.mockReturnValue(fakeClient);

    await authenticateToken(req, res, next);

    expect(mockGetUser).toHaveBeenCalledWith("valid-token");
    expect(req.user).toEqual(fakeUser);
    expect(req.supabase).toBe(fakeClient);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("edge case: returns 401 when provider returns no user object", async () => {
    const req = { headers: { authorization: "Bearer missing-user-token" } };
    const res = createMockRes();
    const next = vi.fn();

    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("error case: returns 401 when auth provider returns explicit error", async () => {
    const req = { headers: { authorization: "Bearer invalid-token" } };
    const res = createMockRes();
    const next = vi.fn();

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "expired" },
    });

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or expired token",
    });
    expect(mockCreateUserClient).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

describe("errorHandler middleware (additional coverage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normal case: uses custom status and message when provided", () => {
    const err = { status: 409, message: "Pantry item already exists" };
    const req = {};
    const res = createMockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "Pantry item already exists",
    });
  });

  it("edge case: includes stack trace in development mode", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const err = { status: 500, message: "Dev failure", stack: "line-1" };
    const req = {};
    const res = createMockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Dev failure",
      stack: "line-1",
    });

    process.env.NODE_ENV = originalNodeEnv;
  });

  it("error case: hides stack trace outside development", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const err = { status: 500, message: "Prod failure", stack: "secret-stack" };
    const req = {};
    const res = createMockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Prod failure",
    });

    process.env.NODE_ENV = originalNodeEnv;
  });
});

describe("generateRecipe service (additional coverage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("normal case: sends user prompt and parses recipe payload", async () => {
    const recipe = { title: "Rice Bowl", servings: 1, ingredients: [], steps: [] };
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(recipe) } }],
    });

    const result = await generateRecipe("Make a rice bowl", { servings: 1 });

    expect(result).toEqual(recipe);
    expect(openaiCreateMock).toHaveBeenCalledTimes(1);
    expect(openaiCreateMock.mock.calls[0][0].messages[1]).toEqual({
      role: "user",
      content: "Make a rice bowl",
    });
  });

  it("edge case: injects dietary filter and skill level into system prompt", async () => {
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ title: "Tofu", steps: [] }) } }],
    });

    await generateRecipe("Make tofu", {
      dietaryFilters: ["vegan", "gluten-free"],
      skillLevel: "advanced",
      servings: 3,
    });

    const systemPrompt = openaiCreateMock.mock.calls[0][0].messages[0].content;
    expect(systemPrompt).toContain("vegan, gluten-free");
    expect(systemPrompt).toContain("advanced");
    expect(systemPrompt).toContain("Serve 3 people");
  });

  it("error case: throws standardized error when API key is missing", async () => {
    process.env.OPENAI_API_KEY = "";
    openaiCreateMock.mockReset();

    await expect(generateRecipe("Make stew")).rejects.toThrow(
      "Failed to generate recipe"
    );
  });
});

describe("getSubstitutions service (additional coverage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("normal case: returns substitutions and keeps ratios", async () => {
    const substitutions = [
      { name: "Flax egg", ratio: "1:1", notes: "Good binder" },
      { name: "Applesauce", ratio: "1:1", notes: "Slightly sweet" },
    ];
    openaiCreateMock.mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify({ substitutions }) } },
      ],
    });

    const result = await getSubstitutions("egg", ["vegan"]);
    expect(result).toEqual(substitutions);
  });

  it("edge case: prompts with 'none' when dietary filters are omitted", async () => {
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ substitutions: [] }) } }],
    });

    await getSubstitutions("milk");
    const prompt = openaiCreateMock.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("dietary restrictions: none");
  });

  it("error case: throws standardized error when model returns invalid JSON", async () => {
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: "not-json" } }],
    });

    await expect(getSubstitutions("butter")).rejects.toThrow(
      "Failed to get substitutions"
    );
  });
});

describe("findPantryRecipes service (additional coverage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("normal case: returns recipe list from model response", async () => {
    const recipes = [{ name: "Tomato Pasta", matchPercentage: 90 }];
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ recipes }) } }],
    });

    const result = await findPantryRecipes(["tomato", "pasta"], ["vegetarian"], 3);
    expect(result).toEqual(recipes);
  });

  it("edge case: builds prompt with ingredient list and requested limit", async () => {
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ recipes: [] }) } }],
    });

    await findPantryRecipes(["beans", "rice"], [], 2);
    const prompt = openaiCreateMock.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("beans, rice");
    expect(prompt).toContain("suggest 2 recipes");
  });

  it("error case: throws standardized error for upstream API failures", async () => {
    openaiCreateMock.mockRejectedValue(new Error("timeout"));

    await expect(findPantryRecipes(["onion"])).rejects.toThrow(
      "Failed to find pantry recipes"
    );
  });
});
