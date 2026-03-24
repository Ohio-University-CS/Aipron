import express from "express";
import { chatWithAssistant } from "../services/openai.js";

export const chatRouter = express.Router();

chatRouter.post("/", async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ error: "messages must be a non-empty array" });
    }

    const content = await chatWithAssistant(messages);
    res.json({ content });
  } catch (error) {
    next(error);
  }
});
