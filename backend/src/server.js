import "./loadEnv.js";
import { createApp } from "./app.js";

const app = createApp();
const PORT = process.env.PORT || 3001;

const BIND_HOST = process.env.BIND_HOST || "0.0.0.0";
app.listen(PORT, BIND_HOST, () => {
  console.log(`🚀 Server listening on ${BIND_HOST}:${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
});
