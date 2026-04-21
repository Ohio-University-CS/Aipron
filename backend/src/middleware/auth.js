import { supabaseAdmin, createUserClient } from "../db/supabase.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    req.supabase = createUserClient(token);
    next();
  } catch (error) {
    return res.status(500).json({ error: "Authentication error" });
  }
};

// Attaches req.user / req.supabase when a valid token is present, but
// allows the request to proceed anonymously otherwise. Useful for
// endpoints (like recipe search) whose scope widens when the caller
// is signed in but which also serve public traffic.
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      req.user = user;
      req.supabase = createUserClient(token);
    }

    next();
  } catch {
    next();
  }
};
