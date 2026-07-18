import type { ScenarioId } from "../domain/trace";
import {
  fetchRaceVariantIds,
  type FetchRaceVariantId,
} from "./fetch-race/variants";
import {
  missingCleanupVariantIds,
  type MissingCleanupVariantId,
} from "./missing-cleanup/variants";

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

export function isScenarioVariantIdFor<Id extends ScenarioId>(
  scenarioId: Id,
  value: string,
): value is ScenarioVariantMap[Id] {
  return (scenarioVariantRegistry[scenarioId] as readonly string[]).includes(value);
}
