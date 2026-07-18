import { z } from "zod";
import { evaluateFetchRace, evaluateMissingCleanup } from "../domain/invariant.js";
import type { TraceEvent } from "../domain/trace.js";
import { scenarioContent } from "../app/scenarioContent.js";
import {
  isScenarioVariantIdFor,
  scenarioVariantIds,
} from "../scenarios/registry.js";

const traceEventKinds = [
  "render",
  "effect_start",
  "timer_start",
  "timer_tick",
  "timer_stop",
  "async_start",
  "async_resolve",
  "cleanup",
  "abort",
  "response_ignored",
  "loading_change",
  "value_read",
  "state_write",
  "stale_write",
  "invariant_pass",
  "invariant_fail",
] as const;

const safeToken = z.string().min(1).max(100).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/);
const traceDataValueSchema = z.union([
  z.string().max(100).regex(/^[a-zA-Z0-9 ._:/-]*$/),
  z.number().finite(),
  z.boolean(),
]);
const traceDataSchema = z
  .record(z.string().min(1).max(40).regex(/^[a-zA-Z][a-zA-Z0-9]*$/), traceDataValueSchema)
  .refine((data) => Object.keys(data).length <= 12, "Trace data has too many fields.");

export const traceEventSchema = z
  .object({
    id: safeToken,
    sequence: z.number().int().min(1).max(80),
    atMs: z.number().finite().min(0).max(86_400_000),
    kind: z.enum(traceEventKinds),
    actor: safeToken,
    message: z.string().min(1).max(240),
    data: traceDataSchema.optional(),
  })
  .strict();

const scenarioIdSchema = z.enum(["fetch-race", "missing-cleanup"]);
const sourceVariantSchema = z.enum(scenarioVariantIds);

export const analyzeAttemptRequestSchema = z
  .object({
    scenarioId: scenarioIdSchema,
    predictionId: safeToken,
    repairId: safeToken.nullable(),
    sourceVariant: sourceVariantSchema,
    invariantPassed: z.boolean(),
    trace: z.array(traceEventSchema).min(2).max(80),
  })
  .strict()
  .superRefine((request, context) => {
    const scenario = scenarioContent[request.scenarioId];
    const predictionAllowed = scenario.predictions.some(
      (prediction) => prediction.id === request.predictionId,
    );
    if (!predictionAllowed) {
      context.addIssue({
        code: "custom",
        path: ["predictionId"],
        message: "Prediction does not belong to scenario.",
      });
    }

    if (!isScenarioVariantIdFor(request.scenarioId, request.sourceVariant)) {
      context.addIssue({
        code: "custom",
        path: ["sourceVariant"],
        message: "Variant does not belong to scenario.",
      });
    }

    const expectedRepair = scenario.repairs.find(
      (repair) => repair.id === request.repairId,
    );
    const expectedVariant = expectedRepair?.variantId ?? scenario.bugVariantId;
    if (
      (request.repairId !== null && !expectedRepair) ||
      request.sourceVariant !== expectedVariant
    ) {
      context.addIssue({
        code: "custom",
        path: ["repairId"],
        message: "Repair and executed variant do not match.",
      });
    }

    const ids = new Set<string>();
    request.trace.forEach((event, index) => {
      if (event.sequence !== index + 1) {
        context.addIssue({
          code: "custom",
          path: ["trace", index, "sequence"],
          message: "Trace sequence must be contiguous.",
        });
      }
      if (ids.has(event.id)) {
        context.addIssue({
          code: "custom",
          path: ["trace", index, "id"],
          message: "Trace event IDs must be unique.",
        });
      }
      ids.add(event.id);
    });

    const terminal = request.trace.at(-1);
    const terminalKind = request.invariantPassed ? "invariant_pass" : "invariant_fail";
    if (terminal?.kind !== terminalKind) {
      context.addIssue({
        code: "custom",
        path: ["trace"],
        message: "Terminal event does not match invariant result.",
      });
      return;
    }
    if (
      request.trace.slice(0, -1).some(
        (event) => event.kind === "invariant_pass" || event.kind === "invariant_fail",
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["trace"],
        message: "Invariant event must appear only at trace end.",
      });
      return;
    }

    const runtimeTrace = request.trace.slice(0, -1) as readonly TraceEvent[];
    const evaluated = request.scenarioId === "fetch-race"
      ? evaluateFetchRace(runtimeTrace)
      : evaluateMissingCleanup(runtimeTrace);
    const expectedStatus = request.invariantPassed ? "pass" : "fail";
    if (evaluated.status !== expectedStatus) {
      context.addIssue({
        code: "custom",
        path: ["trace"],
        message: "Server invariant evaluation rejected trace result.",
      });
    }
  });

export const coachFeedbackSchema = z
  .object({
    verdict: z.enum(["correct", "partly_correct", "incorrect"]),
    misconception: z.string().min(1).max(320),
    evidence: z
      .array(
        z
          .object({
            eventId: safeToken,
            explanation: z.string().min(1).max(240),
          })
          .strict(),
      )
      .min(1)
      .max(3),
    hint: z.string().min(1).max(240),
    transferQuestion: z
      .object({
        prompt: z.string().min(1).max(240),
        options: z.array(z.string().min(1).max(140)).min(2).max(4),
      })
      .strict(),
  })
  .strict();

export const analyzeAttemptResponseSchema = z
  .object({
    feedback: coachFeedbackSchema,
    model: z.string().min(1).max(80),
    requestId: safeToken,
  })
  .strict();

export type AnalyzeAttemptRequest = z.infer<typeof analyzeAttemptRequestSchema>;
export type CoachFeedback = z.infer<typeof coachFeedbackSchema>;
export type AnalyzeAttemptResponse = z.infer<typeof analyzeAttemptResponseSchema>;

export function validateFeedbackEvidence(
  feedback: CoachFeedback,
  trace: readonly TraceEvent[],
): CoachFeedback {
  const eventIds = new Set(trace.map((event) => event.id));
  const cited = new Set<string>();
  for (const evidence of feedback.evidence) {
    if (!eventIds.has(evidence.eventId) || cited.has(evidence.eventId)) {
      throw new Error("Coach feedback cited invalid or duplicate trace evidence.");
    }
    cited.add(evidence.eventId);
  }
  return feedback;
}
