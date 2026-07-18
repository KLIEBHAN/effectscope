import type { ScenarioId } from "../domain/trace";
import {
  fetchRaceVariantIds,
  type FetchRaceVariantId,
} from "./fetch-race/variants";
import {
  missingCleanupVariantIds,
  type MissingCleanupVariantId,
} from "./missing-cleanup/variants";

export type ScenarioVariantId = FetchRaceVariantId | MissingCleanupVariantId;

export const scenarioVariantRegistry: Record<ScenarioId, readonly ScenarioVariantId[]> = {
  "fetch-race": fetchRaceVariantIds,
  "missing-cleanup": missingCleanupVariantIds,
};

const knownVariantIds = new Set<ScenarioVariantId>([
  ...fetchRaceVariantIds,
  ...missingCleanupVariantIds,
]);

export function isScenarioVariantId(value: string): value is ScenarioVariantId {
  return knownVariantIds.has(value as ScenarioVariantId);
}
