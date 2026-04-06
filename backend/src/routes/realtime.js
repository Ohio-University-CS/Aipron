import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  createRealtimeSession,
  cleanupExpiredSessions,
  negotiateRealtimeSdp,
} from "../services/realtime.js";

export const realtimeRouter = express.Router();

// Create Realtime session
realtimeRouter.post("/session", authenticateToken, async (req, res, next) => {
  try {
    const session = await createRealtimeSession(req.user.id);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Browser WebRTC: forward SDP to OpenAI (authenticated user only)
realtimeRouter.post("/negotiate", authenticateToken, async (req, res, next) => {
  try {
    const { sdp, clientSecret, model } = req.body || {};
    const answerSdp = await negotiateRealtimeSdp({ sdp, clientSecret, model });
    res.json({ sdp: answerSdp });
  } catch (error) {
    next(error);
  }
});

// Cleanup expired sessions (cron job endpoint)
realtimeRouter.post("/cleanup", async (req, res, next) => {
  try {
    await cleanupExpiredSessions();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
