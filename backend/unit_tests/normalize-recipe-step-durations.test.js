import { describe, expect, it } from "vitest";
import { normalizeRecipeStepDurations } from "../src/utils/normalizeRecipeStepDurations.js";

describe("normalizeRecipeStepDurations", () => {
  it("converts minute-sized duration when instruction uses the same number with min", () => {
    const steps = [
      {
        stepNumber: 1,
        instruction: "Bake for 30 minutes until golden.",
        duration: 30,
        timerRequired: true,
      },
    ];
    const out = normalizeRecipeStepDurations(steps);
    expect(out[0].duration).toBe(1800);
  });

  it("leaves correct second values when instruction says minutes with a different number", () => {
    const steps = [
      {
        stepNumber: 1,
        instruction: "Cook for 4 minutes until translucent.",
        duration: 240,
        timerRequired: true,
      },
    ];
    const out = normalizeRecipeStepDurations(steps);
    expect(out[0].duration).toBe(240);
  });

  it("does not convert when instruction specifies seconds", () => {
    const steps = [
      {
        stepNumber: 1,
        instruction: "Stir constantly for 30 seconds.",
        duration: 30,
        timerRequired: true,
      },
    ];
    const out = normalizeRecipeStepDurations(steps);
    expect(out[0].duration).toBe(30);
  });

  it("does not convert when timer is not required", () => {
    const steps = [
      {
        stepNumber: 1,
        instruction: "Rest for 30 minutes.",
        duration: 30,
        timerRequired: false,
      },
    ];
    const out = normalizeRecipeStepDurations(steps);
    expect(out[0].duration).toBe(30);
  });
});
