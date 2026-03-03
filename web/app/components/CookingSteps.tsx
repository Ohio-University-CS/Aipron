import { useState } from "react";
import { CheckCircle2, Circle, ChefHat } from "lucide-react";

interface Step {
  id: number;
  instruction: string;
  duration?: string;
}

interface CookingStepsProps {
  steps: Step[];
}

export function CookingSteps({ steps }: CookingStepsProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set()
  );

  const toggleStep = (stepId: number) => {
    const next = new Set(completedSteps);
    if (next.has(stepId)) {
      next.delete(stepId);
    } else {
      next.add(stepId);
      if (stepId === currentStep && currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
    setCompletedSteps(next);
  };

  return (
    <div className="rounded-xl border-2 border-amber-100 bg-white p-4 shadow-lg">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
        <ChefHat className="h-5 w-5 text-orange-500" />
        Cooking Steps
      </h2>
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = currentStep === index && !isCompleted;
          return (
            <div
              key={step.id}
              className={[
                "relative rounded-lg p-3 transition-all",
                isCurrent
                  ? "border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md"
                  : isCompleted
                  ? "border-2 border-gray-200 bg-gray-50"
                  : "border-2 border-gray-100 bg-white",
              ].join(" ")}
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className="mt-0.5 flex-shrink-0"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle
                      className={[
                        "h-5 w-5",
                        isCurrent ? "text-orange-500" : "text-gray-300",
                      ].join(" ")}
                    />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className={[
                        "text-xs font-bold",
                        isCurrent
                          ? "text-orange-600"
                          : isCompleted
                          ? "text-gray-400"
                          : "text-gray-500",
                      ].join(" ")}
                    >
                      STEP {index + 1}
                    </span>
                    {step.duration && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                        {step.duration}
                      </span>
                    )}
                  </div>
                  <p
                    className={[
                      "text-sm leading-relaxed",
                      isCompleted
                        ? "line-through text-gray-400"
                        : "text-gray-700",
                    ].join(" ")}
                  >
                    {step.instruction}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

