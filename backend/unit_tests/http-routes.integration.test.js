import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.mocked(console.error).mockRestore();
});

const { mockFrom, chatWithAssistantMock } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  chatWithAssistantMock: vi.fn(),
}));

vi.mock("../src/db/supabase.js", () => ({
  supabaseAdmin: {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      admin: {
        createUser: vi.fn(),
      },
    },
  },
  createUserClient: vi.fn(),
}));

vi.mock("../src/services/openai.js", () => ({
  generateRecipe: vi.fn(),
  getSubstitutions: vi.fn(),
  chatWithAssistant: chatWithAssistantMock,
  findPantryRecipes: vi.fn(),
}));

import { createApp } from "../src/app.js";

function makeRecipesQueryMock(result = { data: [], error: null }) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    contains: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    filter: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => Promise.resolve(result)),
  };
  return chain;
}

describe("HTTP integration (createApp + supertest)", () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation(() => makeRecipesQueryMock());
    chatWithAssistantMock.mockResolvedValue("Assistant reply");
    app = createApp();
  });

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health").expect(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
    expect(res.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("GET /api/recipes/search returns JSON array when Supabase succeeds", async () => {
    mockFrom.mockImplementation(() => makeRecipesQueryMock({ data: [{ id: "1", title: "Soup" }], error: null }));

    const res = await request(app).get("/api/recipes/search").expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("Soup");
    expect(mockFrom).toHaveBeenCalledWith("recipes");
  });

  it("POST /api/chat validates messages array", async () => {
    const res = await request(app).post("/api/chat").send({}).expect(400);

    expect(res.body.error || res.body).toBeDefined();
  });

  it("POST /api/chat returns assistant content when OpenAI succeeds", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ messages: [{ role: "user", content: "Hello" }] })
      .expect(200);

    expect(res.body.content).toBe("Assistant reply");
    expect(chatWithAssistantMock).toHaveBeenCalled();
  });

  it("POST /api/chat forwards service errors to error handler", async () => {
    chatWithAssistantMock.mockRejectedValue(new Error("upstream failure"));

    const res = await request(app)
      .post("/api/chat")
      .send({ messages: [{ role: "user", content: "Hello" }] })
      .expect(500);

    expect(res.body.error).toBeDefined();
  });

  it("unknown routes return 404 JSON", async () => {
    const res = await request(app).get("/api/does-not-exist").expect(404);
    expect(res.body.error).toBe("Route not found");
  });
});
