import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.js";
import { recipesRouter } from "./routes/recipes.js";
import { pantryRouter } from "./routes/pantry.js";
import { realtimeRouter } from "./routes/realtime.js";
import { cookingRouter } from "./routes/cooking.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
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
      // Development: allow any localhost / 127.0.0.1 (any port) and typical LAN Expo URLs.
      if (!origin) {
        return callback(null, true);
      }
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/pantry", pantryRouter);
app.use("/api/realtime", realtimeRouter);
app.use("/api/cooking", cookingRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
});
