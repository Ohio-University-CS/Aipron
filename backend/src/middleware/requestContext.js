import { randomUUID } from "crypto";

/** Attaches `req.requestId` and exposes it as `X-Request-Id` for correlating client issues with logs. */
export function requestContext(req, res, next) {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
