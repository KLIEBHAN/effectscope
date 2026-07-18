import type { ScenarioId } from "../domain/trace.js";
import {
  fetchRaceVariantIds,
  type FetchRaceVariantId,
} from "./fetch-race/variants.js";
import {
  missingCleanupVariantIds,
  type MissingCleanupVariantId,
} from "./missing-cleanup/variants.js";

export type ScenarioVariantMap = {
  "fetch-race": FetchRaceVariantId;
  "missing-cleanup": MissingCleanupVariantId;
};

export type ScenarioVariantId = ScenarioVariantMap[ScenarioId];

export const scenarioVariantRegistry: {
  readonly [Id in ScenarioId]: readonly ScenarioVariantMap[Id][];
} = {
  "fetch-race": fetchRaceVariantIds,
  "missing-cleanup": missingCleanupVariantIds,
};

export const scenarioVariantIds = [
  ...fetchRaceVariantIds,
  ...missingCleanupVariantIds,
] as const;

export function isScenarioVariantIdFor<Id extends ScenarioId>(
  scenarioId: Id,
  value: string,
): value is ScenarioVariantMap[Id] {
  return (scenarioVariantRegistry[scenarioId] as readonly string[]).includes(value);
}
