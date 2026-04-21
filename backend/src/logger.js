/**
 * Minimal structured logging (JSON lines) for production-friendly grep and log drains.
 * Optional error tracking: set SENTRY_DSN and add @sentry/node in the server entry if you use Sentry.
 */

export function logError(req, err, extra = {}) {
  const payload = {
    level: "error",
    msg: err?.message ?? String(err),
    requestId: req?.requestId,
    method: req?.method,
    path: req?.originalUrl ?? req?.url,
    name: err?.name,
    ...extra,
  };

  if (process.env.NODE_ENV === "development") {
    console.error(JSON.stringify(payload), err);
  } else {
    console.error(JSON.stringify(payload));
  }
}

export function logInfo(req, msg, extra = {}) {
  const payload = {
    level: "info",
    msg,
    requestId: req?.requestId,
    method: req?.method,
    path: req?.originalUrl ?? req?.url,
    ...extra,
  };
  console.log(JSON.stringify(payload));
}
