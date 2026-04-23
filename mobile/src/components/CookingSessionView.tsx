import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "./LinearGradient";
import {
  Ingredient,
  normalizeRecipeStepDurations,
  Recipe,
  RecipeStep,
} from "@aipron/shared";
import { GradientButton } from "./GradientButton";
import { cookingApi, recipeApi } from "../services/api";
import { findLocalCatalogRecipeById } from "../data/localCatalog";
import { useThemeColors } from "../hooks/useThemeColors";
import { useRealtimeVoice, type RealtimeToolCall } from "../hooks/useRealtimeVoice";
import { useUserPrefsStore } from "../store/useUserPrefsStore";
import {
  borderRadius,
  fonts,
  shadows,
  spacing,
  typography,
} from "../constants/DesignTokens";
import { pickFallbackPhoto, recipeImageFallbackSeed } from "../constants/StitchImages";

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type FlowPhase = "mise" | "prep" | "cook";

function splitPrepCookSteps(steps: RecipeStep[]): {
  prepSteps: RecipeStep[];
  cookSteps: RecipeStep[];
} {
  const sorted = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
  const hasAnyPhase = sorted.some(
    (s) => s.phase === "prep" || s.phase === "cook",
  );
  if (!hasAnyPhase) {
    return { prepSteps: [], cookSteps: sorted };
  }
  const prepSteps = sorted.filter((s) => s.phase === "prep");
  const cookSteps = sorted.filter(
    (s) => s.phase === "cook" || s.phase == null,
  );
  return { prepSteps, cookSteps };
}

function formatIngredientLine(ing: Ingredient): string {
  const measure =
    ing.quantity != null && ing.unit
      ? `${ing.quantity} ${ing.unit}`
      : ing.quantity != null
        ? String(ing.quantity)
        : "";
  const base = measure ? `${ing.name} — ${measure}` : ing.name;
  return ing.notes ? `${base} (${ing.notes})` : base;
}

export type CookingSessionViewProps = {
  recipeId: string;
  onClose: () => void;
};

export function CookingSessionView({
  recipeId,
  onClose,
}: CookingSessionViewProps) {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const dietaryTags = useUserPrefsStore((s) => s.dietaryPreferences);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [flow, setFlow] = useState<FlowPhase>("mise");
  const [phaseStepIndex, setPhaseStepIndex] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);
  const [lastSubstitutionNote, setLastSubstitutionNote] = useState<string | null>(null);

  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerInitial, setTimerInitial] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs so tool-call handlers (registered once on connect) can always read
  // live flow state without re-registering handlers on every step change.
  const recipeRef = useRef<Recipe | null>(null);
  const flowRef = useRef<FlowPhase>("mise");
  const phaseIndexRef = useRef<number>(1);

  // "forward" means the user advanced to a new step (auto-narrate).
  // "backward" means they went back (don't auto-narrate — they've already
  // heard it; they can say "repeat" if they need it again).
  const navDirectionRef = useRef<"forward" | "backward">("forward");

  const isLocalCatalogRecipe = useMemo(
    () => !!findLocalCatalogRecipeById(recipeId),
    [recipeId],
  );

  useEffect(() => {
    setFlow("mise");
    setPhaseStepIndex(1);
    loadRecipe();
    startSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  useEffect(() => {
    return () => {
      voice.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  const loadRecipe = async () => {
    const local = findLocalCatalogRecipeById(recipeId);
    if (local) {
      setRecipe({
        ...local,
        steps: normalizeRecipeStepDurations(local.steps),
      });
      return;
    }
    try {
      const data = await recipeApi.getById(recipeId);
      setRecipe({
        ...data,
        steps: normalizeRecipeStepDurations(data.steps ?? []),
      });
    } catch (error) {
      console.error("Failed to load recipe:", error);
    }
  };

  const startSession = async () => {
    if (!recipeId || isLocalCatalogRecipe) return;
    try {
      const data = await cookingApi.startSession(recipeId);
      const sid = (data as { id?: string })?.id;
      if (typeof sid === "string") setSessionId(sid);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const { prepSteps, cookSteps } = useMemo(
    () => (recipe ? splitPrepCookSteps(recipe.steps) : { prepSteps: [], cookSteps: [] }),
    [recipe],
  );

  const activeStep = useMemo(() => {
    if (!recipe || flow === "mise") return null;
    if (flow === "prep") {
      return prepSteps[phaseStepIndex - 1] ?? null;
    }
    return cookSteps[phaseStepIndex - 1] ?? null;
  }, [recipe, flow, prepSteps, cookSteps, phaseStepIndex]);

  const syncSessionStep = (globalStep: number) => {
    if (!isLocalCatalogRecipe && sessionId && globalStep >= 1) {
      cookingApi.updateStep(sessionId, globalStep).catch(() => {});
    }
  };

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerRunning(false);
    if (activeStep?.timerRequired && activeStep.duration) {
      setTimerInitial(activeStep.duration);
      setTimerSeconds(activeStep.duration);
    } else {
      setTimerInitial(null);
      setTimerSeconds(null);
    }
  }, [activeStep]);

  useEffect(() => {
    if (timerRunning && timerSeconds != null && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev == null) return prev;
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerSeconds]);

  const handleLeaveMise = () => {
    navDirectionRef.current = "forward";
    if (prepSteps.length > 0) {
      setFlow("prep");
      setPhaseStepIndex(1);
      syncSessionStep(1);
    } else if (cookSteps.length > 0) {
      setFlow("cook");
      setPhaseStepIndex(1);
      syncSessionStep(1);
    }
  };

  const handleNextStep = () => {
    if (!recipe) return;
    navDirectionRef.current = "forward";
    if (flow === "mise") {
      handleLeaveMise();
      return;
    }
    if (flow === "prep") {
      if (phaseStepIndex < prepSteps.length) {
        const next = phaseStepIndex + 1;
        setPhaseStepIndex(next);
        syncSessionStep(next);
      } else if (cookSteps.length > 0) {
        setFlow("cook");
        setPhaseStepIndex(1);
        syncSessionStep(prepSteps.length + 1);
      } else {
        void handleComplete();
      }
      return;
    }
    if (flow === "cook") {
      if (phaseStepIndex < cookSteps.length) {
        const next = phaseStepIndex + 1;
        setPhaseStepIndex(next);
        syncSessionStep(prepSteps.length + next);
      } else {
        void handleComplete();
      }
    }
  };

  const handlePreviousStep = () => {
    if (flow === "mise") return;
    navDirectionRef.current = "backward";
    if (flow === "prep") {
      if (phaseStepIndex > 1) {
        const prev = phaseStepIndex - 1;
        setPhaseStepIndex(prev);
        syncSessionStep(prev);
      } else {
        setFlow("mise");
      }
      return;
    }
    if (flow === "cook") {
      if (phaseStepIndex > 1) {
        const prev = phaseStepIndex - 1;
        setPhaseStepIndex(prev);
        syncSessionStep(prepSteps.length + prev);
      } else if (prepSteps.length > 0) {
        setFlow("prep");
        setPhaseStepIndex(prepSteps.length);
        syncSessionStep(prepSteps.length);
      } else {
        setFlow("mise");
      }
    }
  };

  const handleComplete = async () => {
    if (isLocalCatalogRecipe) {
      onClose();
      return;
    }
    try {
      if (sessionId) await cookingApi.completeSession(sessionId);
      onClose();
    } catch (error) {
      console.error("Failed to complete session:", error);
      onClose();
    }
  };

  // Keep refs in sync so Realtime tool-call handlers (see onToolCall below)
  // always see the latest flow state without re-subscribing.
  useEffect(() => {
    recipeRef.current = recipe;
  }, [recipe]);
  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);
  useEffect(() => {
    phaseIndexRef.current = phaseStepIndex;
  }, [phaseStepIndex]);

  const getCurrentStepInstruction = useCallback((): string | null => {
    const r = recipeRef.current;
    if (!r) return null;
    const { prepSteps: ps, cookSteps: cs } = splitPrepCookSteps(r.steps);
    if (flowRef.current === "mise") {
      return "Get everything measured and within reach before starting the stove.";
    }
    const list = flowRef.current === "prep" ? ps : cs;
    const step = list[phaseIndexRef.current - 1];
    return step?.instruction ?? null;
  }, []);

  // Stable ref to the advance handler so the onToolCall callback (registered
  // once on connect) can trigger the latest behavior on each invocation.
  const nextStepRef = useRef<() => void>(() => {});

  // Sibling ref so the tool-call handler can fire a fresh narration when the
  // user says "repeat". Wired below alongside sendToolResultRef.
  const sendNarrationRef = useRef<((text: string) => void) | null>(null);
  // Clears the narration-dedupe signature so the next step's narration runs
  // even if we just replayed the same one via "repeat".
  const resetNarrationMemoRef = useRef<() => void>(() => {});

  const handleToolCall = useCallback(
    (toolCall: RealtimeToolCall) => {
      const respond = (result: unknown) => {
        // sendToolResult is captured below via the hook's return value, so we
        // set it on a ref to avoid a forward-declaration cycle with the hook.
        sendToolResultRef.current?.(toolCall.callId, result);
      };

      switch (toolCall.name) {
        case "next_step": {
          nextStepRef.current();
          respond({ ok: true });
          return;
        }
        case "repeat_step": {
          const instruction = getCurrentStepInstruction();
          if (instruction) {
            // Don't trust the model to re-speak the step verbatim from the
            // tool output — it tends to paraphrase or drop a clause. Instead
            // acknowledge the tool call with a short payload and fire a fresh
            // narration so the same deterministic TTS path that handles
            // step-advance also handles "repeat". sendNarration queues until
            // the current response wraps up, so this is safe to call inline.
            respond({ ok: true });
            resetNarrationMemoRef.current();
            sendNarrationRef.current?.(instruction);
          } else {
            respond({ ok: false, error: "no active step" });
          }
          return;
        }
        case "start_timer": {
          const duration = Number(toolCall.args?.duration);
          if (Number.isFinite(duration) && duration > 0) {
            setTimerInitial(duration);
            setTimerSeconds(duration);
            setTimerRunning(true);
            respond({ ok: true, duration });
          } else {
            respond({ ok: false, error: "invalid duration" });
          }
          return;
        }
        case "ingredient_substitution": {
          const ingredient = String(toolCall.args?.ingredient ?? "").trim();
          if (!ingredient) {
            respond({ ok: false, error: "missing ingredient" });
            return;
          }
          recipeApi
            .getSubstitutions(ingredient)
            .then((result) => {
              const subs = (result as { substitutions?: unknown[] })?.substitutions ?? [];
              const topThree = Array.isArray(subs) ? subs.slice(0, 3) : [];
              if (topThree.length > 0) {
                setLastSubstitutionNote(
                  `Substitutions for ${ingredient}: ${topThree
                    .map((s) => (s as { name?: string })?.name)
                    .filter(Boolean)
                    .join(", ")}`
                );
              }
              respond({ ok: true, ingredient, substitutions: topThree });
            })
            .catch(() => respond({ ok: false, error: "lookup failed" }));
          return;
        }
        default:
          respond({ ok: false, error: "unknown tool" });
      }
    },
    [getCurrentStepInstruction]
  );

  // Ref used inside handleToolCall to call sendToolResult without creating a
  // circular dependency on the hook's return value.
  const sendToolResultRef = useRef<
    ((callId: string, result: unknown) => void) | null
  >(null);

  const voice = useRealtimeVoice({
    onToolCall: handleToolCall,
    onError: (err) => console.warn("[cooking] realtime error:", err.message),
  });
  sendToolResultRef.current = voice.sendToolResult;
  sendNarrationRef.current = voice.sendNarration;

  // Extract stable primitives / callbacks so the narration and instructions
  // effects only re-run when something meaningful changes. Using the full
  // `voice` object as a dep causes re-runs on every isSpeaking / isListening
  // flip, which is what caused the double-narration bug.
  const voiceIsConnected = voice.isConnected;
  const voiceSendNarration = voice.sendNarration;       // useCallback — stable
  const voiceUpdateInstructions = voice.updateInstructions; // useCallback — stable

  // Narration gate — tracked here (not after the loading-guard return) so the
  // hooks order stays consistent across the pre- and post-recipe-load renders.
  const lastNarratedRef = useRef<string>("");
  // Expose a reset to the tool-call handler so "repeat" can force re-narration
  // (otherwise the signature would match and early-return would block it).
  resetNarrationMemoRef.current = () => {
    lastNarratedRef.current = "";
  };

  // Narrate each step as the user moves forward. Going backward is silent —
  // the user already heard it; they can say "repeat" if they need it again.
  useEffect(() => {
    if (!voiceIsConnected || !recipe) return;
    if (navDirectionRef.current === "backward") return;
    const signature = `${flow}-${phaseStepIndex}`;
    // Guard is set synchronously before sendNarration so even if the effect
    // fires multiple times in the same render cycle (React Strict Mode double-
    // invoke, state-flush batching, etc.) only one narration goes out.
    if (lastNarratedRef.current === signature) return;
    const instruction = getCurrentStepInstruction();
    if (!instruction) return;
    lastNarratedRef.current = signature;          // set BEFORE the async call
    voiceSendNarration(instruction);
  }, [voiceIsConnected, flow, phaseStepIndex, recipe, getCurrentStepInstruction, voiceSendNarration]);

  // Push session instructions whenever the recipe loads or dietary prefs
  // change. Not triggered by speaking/listening state changes.
  useEffect(() => {
    if (!voiceIsConnected || !recipe) return;
    const stepsSummary = recipe.steps
      .map((s) => `${s.stepNumber}. ${s.instruction}`)
      .join("\n");
    const ingredientsSummary = recipe.ingredients
      .map((i) => formatIngredientLine(i))
      .join("\n");
    const prefsLine =
      dietaryTags.length > 0
        ? `\nDIETARY PREFERENCES (must respect): ${dietaryTags.join(", ")}. If the user asks for a substitution, only suggest ingredients that comply with these preferences.\n`
        : "\nDIETARY PREFERENCES: none set.\n";
    voiceUpdateInstructions(
      `You are the user's voice-guided cooking companion for "${recipe.title}".\n\n` +
        `INGREDIENTS:\n${ingredientsSummary}\n\n` +
        `STEPS:\n${stepsSummary}\n` +
        prefsLine +
        `\nGuidance:\n` +
        `- When the user says "next", "continue", "move on", "what's next", "ready", "okay", or similar, CALL the next_step tool. Do not speak before calling it.\n` +
        `- When the user says "repeat", "repeat step", "repeat that", "say that again", "what was that", "again", "one more time", or anything that means replay, CALL the repeat_step tool. After calling it, DO NOT speak at all — our app will replay the exact step text itself. Stay completely silent until the user talks again.\n` +
        `- When they ask to start a timer or when a step needs one, CALL the start_timer tool.\n` +
        `- When they ask for a substitute for an ingredient, CALL the ingredient_substitution tool.\n` +
        `- Do NOT read the whole recipe unprompted; narrate one step at a time, only when the UI asks you (via a narration request) or the user asks to repeat.\n` +
        `- Keep spoken replies short and calm. Never apologize for pausing — this is a hands-busy cooking flow.`
    );
  }, [voiceIsConnected, recipe, dietaryTags, voiceUpdateInstructions]);

  const topBarHeight = insets.top + 56;

  if (!recipe) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <StatusBar barStyle="dark-content" />
        <Text style={[typography.body, { color: theme.onSurfaceVariant }]}>
          Loading recipe...
        </Text>
      </View>
    );
  }

  const totalStepsInPhase =
    flow === "prep"
      ? prepSteps.length
      : flow === "cook"
        ? cookSteps.length
        : 0;

  const isLastStep =
    flow === "cook" && cookSteps.length > 0
      ? phaseStepIndex === cookSteps.length
      : flow === "prep" &&
          cookSteps.length === 0 &&
          prepSteps.length > 0
        ? phaseStepIndex === prepSteps.length
        : false;

  const progressHeadline =
    flow === "mise"
      ? "MISE EN PLACE"
      : flow === "prep"
        ? `PREP ${phaseStepIndex} OF ${prepSteps.length}`
        : `COOK ${phaseStepIndex} OF ${cookSteps.length}`;

  const timerPhaseLabel = flow === "prep" ? "PREP" : "COOK";

  const nextButtonTitle = (() => {
    if (flow === "mise") {
      return prepSteps.length > 0
        ? "Start prep"
        : "Start cooking";
    }
    return isLastStep ? "Finish" : "Next Step";
  })();

  const dotCount =
    flow === "mise" ? 1 : Math.max(1, totalStepsInPhase);

  // Keep the tool-call handler pointing at the current state. This is a plain
  // ref assignment (not a hook), so it is safe after the `if (!recipe)` guard.
  nextStepRef.current = () => {
    if (isLastStep) void handleComplete();
    else handleNextStep();
  };

  const handleVoicePress = () => {
    if (voice.isConnecting) return;
    if (voice.isConnected) {
      voice.disconnect();
    } else {
      void voice.connect();
    }
  };

  const voiceSupported = true;

  const heroImageUri =
    recipe.heroImage ||
    pickFallbackPhoto(recipeImageFallbackSeed(recipe));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" />

      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: theme.surface + "E6",
            borderBottomColor: theme.outlineVariant + "1A",
          },
        ]}
      >
        <TouchableOpacity
          onPress={onClose}
          style={[
            styles.topIconBtn,
            { backgroundColor: theme.surfaceContainer },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="close" size={22} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={[styles.topWordmark, { color: theme.primary }]}>
            Aipron
          </Text>
          <Text
            style={[styles.topSubtitle, { color: theme.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {recipe.title}
          </Text>
        </View>
        <View
          style={[
            styles.topAvatar,
            {
              borderColor: theme.primaryContainer,
              backgroundColor: theme.surfaceContainerHighest,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <MaterialIcons
            name="person"
            size={26}
            color={theme.outline}
            style={{ marginTop: 3 }}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topBarHeight + spacing.lg,
            paddingBottom: insets.bottom + 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={[styles.stepLabel, { color: theme.secondary }]}>
                {progressHeadline}
              </Text>
              <Text style={[styles.stepLabelRight, { color: theme.outline }]}>
                {recipe.totalTime ? `${recipe.totalTime} MIN TOTAL` : ""}
              </Text>
            </View>
            {flow !== "mise" && totalStepsInPhase > 0 && (
              <View style={styles.progressBar}>
                {Array.from({ length: totalStepsInPhase }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.progressSegment,
                      {
                        flex: i + 1 === phaseStepIndex ? 1.6 : 1,
                        backgroundColor:
                          i < phaseStepIndex
                            ? theme.primary
                            : theme.outlineVariant + "4D",
                      },
                    ]}
                  />
                ))}
              </View>
            )}
            {flow === "mise" && (
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressSegment,
                    {
                      flex: 1,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          <Text style={[styles.recipeEyebrow, { color: theme.secondary }]}>
            {recipe.title.toUpperCase()}
          </Text>

          {flow === "mise" ? (
            <Text style={[styles.instruction, { color: theme.onSurface }]}>
              Have every ingredient measured and within reach before you turn on
              the stove.
            </Text>
          ) : (
            activeStep && (
              <Text style={[styles.instruction, { color: theme.onSurface }]}>
                {activeStep.instruction}
              </Text>
            )
          )}

          <View style={styles.heroCard}>
            <Image
              source={{ uri: heroImageUri }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(27,28,26,0.18)", "transparent"]}
              style={styles.heroShade}
            />
            {flow !== "mise" &&
              timerInitial != null &&
              timerSeconds != null && (
              <View
                style={[
                  styles.heroTimerOverlay,
                  { backgroundColor: theme.surfaceContainerLowest },
                ]}
              >
                <MaterialIcons name="timer" size={18} color={theme.tertiary} />
                <View>
                  <Text style={[styles.heroTimerLabel, { color: theme.secondary }]}>
                    {timerPhaseLabel}
                  </Text>
                  <Text style={[styles.heroTimerValue, { color: theme.onSurface }]}>
                    {formatClock(timerSeconds)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {flow !== "mise" &&
            timerInitial != null &&
            timerSeconds != null && (
            <View
              style={[
                styles.timerCard,
                { backgroundColor: theme.surfaceContainer },
              ]}
            >
              <Text style={[styles.timerLabel, { color: theme.secondary }]}>
                REMAINING
              </Text>
              <Text style={[styles.timerDisplay, { color: theme.onSurface }]}>
                {formatClock(timerSeconds)}
              </Text>
              <View style={styles.timerControls}>
                <TouchableOpacity
                  onPress={() => setTimerRunning((r) => !r)}
                  style={[
                    styles.timerBtnPrimary,
                    { backgroundColor: theme.primaryContainer },
                  ]}
                  activeOpacity={0.85}
                >
                  <MaterialIcons
                    name={timerRunning ? "pause" : "play-arrow"}
                    size={22}
                    color={theme.onPrimaryContainer}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setTimerRunning(false);
                    setTimerSeconds(timerInitial);
                  }}
                  style={[
                    styles.timerBtnGhost,
                    { borderColor: theme.outlineVariant },
                  ]}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="refresh"
                    size={20}
                    color={theme.onSurface}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View
            style={[
              styles.tipCard,
              { backgroundColor: theme.surfaceContainerLow },
            ]}
          >
            <View
              style={[
                styles.tipIconCircle,
                { backgroundColor: theme.primaryContainer },
              ]}
            >
              <MaterialIcons
                name="auto-awesome"
                size={16}
                color={theme.onPrimaryContainer}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipTitle, { color: theme.onSurface }]}>
                Chef's Tip
              </Text>
              <Text style={[styles.tipBody, { color: theme.onSurfaceVariant }]}>
                {flow === "mise"
                  ? "Lay out tools and bowls now so you are not hunting mid-step when something is on the heat."
                  : activeStep?.timerRequired && activeStep.duration
                    ? `Watch texture, not just time — aim for roughly ${Math.max(
                        1,
                        Math.round(activeStep.duration / 60),
                      )} min and trust your senses.`
                    : "Keep an eye on colour, aroma, and texture. Adjust heat with intention."}
              </Text>
            </View>
          </View>

          {flow === "mise" && recipe.ingredients.length > 0 && (
            <View style={styles.ingredientsSection}>
              <Text
                style={[styles.ingredientsTitle, { color: theme.onSurface }]}
              >
                Ingredients
              </Text>
              {recipe.ingredients.map((ing, idx) => (
                <Text
                  key={ing.id || `${ing.name}-${idx}`}
                  style={[styles.miseIngredientLine, { color: theme.onSurface }]}
                >
                  {formatIngredientLine(ing)}
                </Text>
              ))}
            </View>
          )}

          {flow !== "mise" && recipe.ingredients.length > 0 && (
            <View style={styles.ingredientsSection}>
              <TouchableOpacity
                onPress={() => setIngredientsExpanded((v) => !v)}
                activeOpacity={0.7}
                style={styles.ingredientsHeader}
              >
                <Text
                  style={[styles.ingredientsTitle, { color: theme.onSurface }]}
                >
                  Ingredients at a glance
                </Text>
                <MaterialIcons
                  name={
                    ingredientsExpanded ? "expand-less" : "expand-more"
                  }
                  size={22}
                  color={theme.onSurfaceVariant}
                />
              </TouchableOpacity>
              <View style={styles.chipRow}>
                {(ingredientsExpanded
                  ? recipe.ingredients
                  : recipe.ingredients.slice(0, 6)
                ).map((ing, idx) => (
                  <View
                    key={ing.id || `${ing.name}-${idx}`}
                    style={[
                      styles.ingChip,
                      { backgroundColor: theme.surfaceContainerHigh },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ingChipText,
                        { color: theme.onSurface },
                      ]}
                      numberOfLines={1}
                    >
                      {ing.name}
                    </Text>
                  </View>
                ))}
                {!ingredientsExpanded && recipe.ingredients.length > 6 && (
                  <TouchableOpacity
                    style={[
                      styles.ingChip,
                      {
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor: theme.outlineVariant,
                      },
                    ]}
                    onPress={() => setIngredientsExpanded(true)}
                  >
                    <Text
                      style={[styles.ingChipText, { color: theme.onSurfaceVariant }]}
                    >
                      +{recipe.ingredients.length - 6} more
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View style={styles.voiceRow}>
            <TouchableOpacity
              onPress={handleVoicePress}
              activeOpacity={0.8}
              disabled={!voiceSupported || voice.isConnecting}
              style={[
                styles.voiceButton,
                {
                  backgroundColor: voice.isConnected
                    ? theme.primary
                    : theme.primaryContainer,
                  opacity: voiceSupported ? 1 : 0.45,
                },
              ]}
            >
              {voice.isConnecting ? (
                <ActivityIndicator color={theme.onPrimaryContainer} />
              ) : (
                <MaterialIcons
                  name={voice.isConnected ? "stop" : "mic"}
                  size={22}
                  color={
                    voice.isConnected ? theme.onPrimary : theme.onPrimaryContainer
                  }
                />
              )}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.voiceTitle,
                  {
                    color: voice.isConnected ? theme.primary : theme.onSurface,
                  },
                ]}
              >
                {voice.isConnecting
                  ? "Connecting..."
                  : voice.isSpeaking
                    ? "Speaking..."
                    : voice.isListening
                      ? "Listening..."
                      : voice.isConnected
                        ? "Hands-free on"
                        : "Tap to start voice mode"}
              </Text>
              <Text style={[styles.voiceSub, { color: theme.secondary }]}>
                {voice.error
                  ? voice.error
                  : voice.isConnected
                    ? lastSubstitutionNote ||
                      `Say "next", "repeat", "start the timer", or "what can I use instead of..."`
                    : `Connect to have the chef read each step aloud and respond when you say "next".`}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.surface + "F2",
            paddingBottom: insets.bottom + spacing.md,
            borderTopColor: theme.outlineVariant + "26",
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.bottomTextBtn,
            { opacity: flow === "mise" ? 0.4 : 1 },
          ]}
          onPress={handlePreviousStep}
          disabled={flow === "mise"}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color={theme.onSurfaceVariant}
          />
          <Text style={[styles.bottomTextLabel, { color: theme.onSurfaceVariant }]}>
            PREVIOUS
          </Text>
        </TouchableOpacity>

        <View style={styles.dotsRow}>
          {Array.from({ length: dotCount }).map((_, i) => {
            const active = i + 1 === phaseStepIndex;
            const done = i + 1 < phaseStepIndex;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: active
                      ? theme.primary
                      : done
                        ? theme.primary + "66"
                        : theme.outlineVariant + "66",
                    width: active ? 22 : 6,
                  },
                ]}
              />
            );
          })}
        </View>

        <GradientButton
          title={nextButtonTitle}
          icon={isLastStep ? "check-circle" : "arrow-forward"}
          onPress={isLastStep ? handleComplete : handleNextStep}
          style={styles.nextBtn}
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topCenter: {
    flex: 1,
    justifyContent: "center",
  },
  topWordmark: {
    fontFamily: fonts.serifItalic,
    fontSize: 20,
  },
  topSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  topAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    overflow: "hidden",
  },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  inner: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  progressSection: {
    marginBottom: spacing.xxl,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  stepLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 4,
  },
  stepLabelRight: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 3,
  },
  progressBar: {
    flexDirection: "row",
    gap: 6,
  },
  progressSegment: {
    height: 5,
    borderRadius: 3,
  },
  recipeEyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  instruction: {
    fontFamily: fonts.serif,
    fontSize: 30,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: spacing.xxl,
  },
  heroCard: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderTopLeftRadius: 48,
    borderTopRightRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.xxl,
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.xxl,
    ...shadows.md,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTimerOverlay: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  heroTimerLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    letterSpacing: 2,
  },
  heroTimerValue: {
    fontFamily: fonts.serifBold,
    fontSize: 18,
    lineHeight: 22,
  },
  timerCard: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  timerLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 4,
  },
  timerDisplay: {
    fontFamily: fonts.serifBold,
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -1,
  },
  timerControls: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  timerBtnPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  timerBtnGhost: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tipCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xxl,
    alignItems: "flex-start",
  },
  tipIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    fontFamily: fonts.serifBoldItalic,
    fontSize: 14,
    marginBottom: 2,
  },
  tipBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  ingredientsSection: {
    marginBottom: spacing.xxl,
  },
  ingredientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  ingredientsTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  ingChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  ingChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  miseIngredientLine: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  voiceTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  voiceSub: {
    fontFamily: fonts.serifItalic,
    fontSize: 13,
    marginTop: 2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screenPadding,
    borderTopWidth: 1,
  },
  bottomTextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.sm,
  },
  bottomTextLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 2,
  },
  dotsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextBtn: {
    minWidth: 150,
  },
});
