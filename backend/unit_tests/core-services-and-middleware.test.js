//run it with npm run test --workspace backend
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

describe("authenticateToken middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normal case: attaches user and supabase client, then calls next", async () => {
    const req = { headers: { authorization: "Bearer token-123" } };
    const res = createMockRes();
    const next = vi.fn();
    const fakeUser = { id: "user-1" };
    const fakeClient = { from: vi.fn() };

    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockCreateUserClient.mockReturnValue(fakeClient);

    await authenticateToken(req, res, next);

    expect(mockGetUser).toHaveBeenCalledWith("token-123");
    expect(mockCreateUserClient).toHaveBeenCalledWith("token-123");
    expect(req.user).toEqual(fakeUser);
    expect(req.supabase).toBe(fakeClient);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("edge case: returns 401 when no Authorization token is provided", async () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = vi.fn();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Access token required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("error case: returns 500 when auth provider throws unexpectedly", async () => {
    const req = { headers: { authorization: "Bearer token-123" } };
    const res = createMockRes();
    const next = vi.fn();

    mockGetUser.mockRejectedValue(new Error("network failure"));

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Authentication error" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("errorHandler middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normal case: returns 400 payload for ValidationError", () => {
    const err = { name: "ValidationError", message: "Invalid servings value" };
    const req = {};
    const res = createMockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Validation error",
      details: "Invalid servings value",
    });
  });

  it("edge case: returns 401 payload for UnauthorizedError", () => {
    const err = { name: "UnauthorizedError", message: "Token expired" };
    const req = {};
    const res = createMockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      details: "Token expired",
    });
  });

  it("error case: falls back to 500 with default message", () => {
    const err = { name: "UnknownFailure" };
    const req = {};
    const res = createMockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("generateRecipe service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("normal case: parses and returns recipe JSON from model response", async () => {
    const recipe = { title: "Pasta", servings: 4, ingredients: [], steps: [] };
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(recipe) } }],
    });

    const result = await generateRecipe("Make pasta");

    expect(result).toEqual(recipe);
    expect(openaiCreateMock).toHaveBeenCalledTimes(1);
  });

  it("edge case: supports empty dietary filters and custom servings", async () => {
    const recipe = { title: "Soup", servings: 2, ingredients: [], steps: [] };
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(recipe) } }],
    });

    const result = await generateRecipe("Make soup", {
      dietaryFilters: [],
      servings: 2,
      skillLevel: "beginner",
    });

    expect(result.servings).toBe(2);
    expect(openaiCreateMock).toHaveBeenCalledTimes(1);
  });

  it("error case: throws standardized error when model request fails", async () => {
    openaiCreateMock.mockRejectedValue(new Error("OpenAI unavailable"));

    await expect(generateRecipe("Make curry")).rejects.toThrow(
      "Failed to generate recipe"
    );
  });
});

describe("getSubstitutions service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("normal case: returns substitutions array from response payload", async () => {
    const substitutions = [{ name: "Greek yogurt", ratio: "1:1" }];
    openaiCreateMock.mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify({ substitutions }) } },
      ],
    });

    const result = await getSubstitutions("sour cream", ["vegetarian"]);

    expect(result).toEqual(substitutions);
  });

  it("edge case: returns empty array when substitutions field is missing", async () => {
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({}) } }],
    });

    const result = await getSubstitutions("butter");

    expect(result).toEqual([]);
  });

  it("error case: throws standardized error for malformed model response", async () => {
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: "{bad-json" } }],
    });

    await expect(getSubstitutions("egg")).rejects.toThrow(
      "Failed to get substitutions"
    );
  });
});

describe("findPantryRecipes service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("normal case: returns recipe suggestions array", async () => {
    const recipes = [{ name: "Veggie Stir Fry", matchPercentage: 80 }];
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ recipes }) } }],
    });

    const result = await findPantryRecipes(["broccoli", "soy sauce"]);

    expect(result).toEqual(recipes);
  });

  it("edge case: returns empty array when model omits recipes", async () => {
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({}) } }],
    });

    const result = await findPantryRecipes(["salt"]);

    expect(result).toEqual([]);
  });

  it("error case: throws standardized error when request fails", async () => {
    openaiCreateMock.mockRejectedValue(new Error("rate limited"));

    await expect(findPantryRecipes(["tomato"])).rejects.toThrow(
      "Failed to find pantry recipes"
    );
  });
});
