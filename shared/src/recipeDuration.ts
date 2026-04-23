import type { RecipeStep } from "./types";

/**
 * AI recipes sometimes put "minutes" in `duration` (e.g. 30) while the app expects seconds.
 * If the instruction clearly refers to that same number as minutes, convert to seconds.
 */
export function normalizeRecipeStepDurations(steps: RecipeStep[]): RecipeStep[] {
  if (!Array.isArray(steps)) return steps;
  return steps.map((step) => normalizeSingleStepDuration(step));
}

function normalizeSingleStepDuration(step: RecipeStep): RecipeStep {
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
