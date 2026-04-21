import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { requestContext } from "./middleware/requestContext.js";
import { authRouter } from "./routes/auth.js";
import { recipesRouter } from "./routes/recipes.js";
import { pantryRouter } from "./routes/pantry.js";
import { realtimeRouter } from "./routes/realtime.js";
import { cookingRouter } from "./routes/cooking.js";
import { chatRouter } from "./routes/chat.js";
import { errorHandler } from "./middleware/errorHandler.js";

/**
 * Builds the Express application (no listen). Used by the HTTP server and Supertest.
 */
export function createApp() {
  const app = express();

  app.use(requestContext);
  app.use(helmet());
  const defaultProdOrigins = ["http://localhost:3000", "http://localhost:8081"];
  app.use(
    cors({
      origin(origin, callback) {
        const allowed = process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean);
        if (process.env.NODE_ENV === "production") {
          const list = allowed?.length ? allowed : defaultProdOrigins;
          if (!origin || list.includes(origin)) {
            return callback(null, true);
          }
          return callback(null, false);
        }
        if (!origin) {
          return callback(null, true);
        }
        if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin)) {
          return callback(null, true);
        }
        if (/^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin)) {
          return callback(null, true);
        }
        if (/^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin)) {
          return callback(null, true);
        }
        if (/^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin)) {
          return callback(null, true);
        }
        if (allowed?.length && allowed.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });
  app.use("/api/", limiter);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/recipes", recipesRouter);
  app.use("/api/pantry", pantryRouter);
  app.use("/api/realtime", realtimeRouter);
  app.use("/api/cooking", cookingRouter);
  app.use("/api/chat", chatRouter);

  app.use(errorHandler);

  app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  return app;
}
