import { describe, expect, it } from "vitest";
import { isScenarioVariantIdFor } from "./registry";

describe("isScenarioVariantIdFor", () => {
  it("validates the scenario and variant as a pair", () => {
    expect(isScenarioVariantIdFor("fetch-race", "fetch-race/bug-v1")).toBe(true);
    expect(isScenarioVariantIdFor("fetch-race", "missing-cleanup/bug-v1")).toBe(false);
    expect(
      isScenarioVariantIdFor("missing-cleanup", "missing-cleanup/fix-clear-v1"),
    ).toBe(true);
  });
});
