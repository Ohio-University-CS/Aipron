/**
 * Mirrors shared/src/recipeDuration.ts — keep behavior in sync.
 * AI sometimes emits step duration in minutes; the app expects seconds.
 */
export function normalizeRecipeStepDurations(steps) {
  if (!Array.isArray(steps)) return steps;
  return steps.map((step) => normalizeSingleStepDuration(step));
}

function normalizeSingleStepDuration(step) {
  if (!step || typeof step !== "object") return step;
  const dur = step.duration;
  if (dur == null || !Number.isFinite(Number(dur))) return step;
  let duration = Math.round(Number(dur));
  if (!step.timerRequired) return { ...step, duration };

  const instruction = String(step.instruction ?? "");

  if (/\b\d+\s*(?:sec|second|seconds)\b/i.test(instruction)) {
    const secMatch = instruction.match(/\b(\d+)\s*(?:sec|second|seconds)\b/i);
    if (secMatch && Number(secMatch[1]) === duration) {
      return { ...step, duration };
    }
  }

  const re = new RegExp(
    `\\b(${duration})\\s*(?:min|minute|minutes|mins?)\\b`,
    "i",
  );
  if (re.test(instruction)) {
    const maxMinutes = 24 * 60;
    if (duration >= 1 && duration <= maxMinutes) {
      return { ...step, duration: duration * 60 };
    }
  }

  return { ...step, duration };
}
