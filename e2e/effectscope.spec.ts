import { expect, test, type Page } from "@playwright/test";

async function choose(page: Page, label: string) {
  await page.getByText(label, { exact: true }).click();
}

async function runBug(page: Page) {
  await page.getByRole("button", { name: "Run bug sequence" }).click();
  await expect(page.getByText("Invariant violated", { exact: true })).toBeVisible();
}

test("diagnoses and repairs Fetch Race from prediction to proof", async ({ page }) => {
  await page.goto("/");
  await choose(page, "Todo C appears, then B overwrites it");
  await runBug(page);

  await expect(page.getByText("Your prediction matched the observed bug trace.")).toBeVisible();
  await choose(page, "Abort and guard obsolete requests");
  await expect(page.getByRole("region", { name: "Source under test" })).toContainText(
    "No request cleanup",
  );
  await page.getByRole("button", { name: "Test selected repair" }).click();

  await expect(page.getByText("Invariant proved", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Visible todo")).toHaveText("Todo C");
  await expect(page.getByRole("button", { name: "Retest verified repair" })).toBeEnabled();
});

test("diagnoses and repairs Missing Cleanup", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Missing cleanup" }).click();
  await choose(page, "Old and replacement timers both run");
  await runBug(page);

  await choose(page, "Clear the interval in cleanup");
  await page.getByRole("button", { name: "Test selected repair" }).click();

  await expect(page.getByText("Invariant proved", { exact: true })).toBeVisible();
  await expect(page.getByText("1 / 2 proved once", { exact: true })).toBeVisible();
});

test("reset and scenario switch dispose active runs without late events", async ({ page }) => {
  await page.goto("/");
  await choose(page, "Todo C appears, then B overwrites it");
  await page.getByRole("button", { name: "Run bug sequence" }).click();
  await expect(page.getByRole("button", { name: "Reset" })).toBeEnabled();
  await page.getByRole("button", { name: "Reset" }).click();
  await page.waitForTimeout(1_350);
  await expect(page.getByText("Invariant violated", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);

  await page.getByRole("button", { name: "Run bug sequence" }).click();
  await page.getByRole("button", { name: "Missing cleanup" }).click();
  await page.waitForTimeout(1_350);
  await expect(page.getByRole("heading", { name: "The timer that outlived its component" })).toBeVisible();
  await expect(page.getByRole("log", { name: "Runtime events" })).toHaveCount(0);
});

test("both distractors fail their deterministic invariant", async ({ page }) => {
  await page.goto("/");
  await choose(page, "Todo C appears, then B overwrites it");
  await runBug(page);
  await choose(page, "Add a loading indicator");
  await page.getByRole("button", { name: "Test selected repair" }).click();
  await expect(page.getByText("Invariant violated", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Missing cleanup" }).click();
  await choose(page, "Old and replacement timers both run");
  await runBug(page);
  await choose(page, "Start a second timer on mount");
  await page.getByRole("button", { name: "Test selected repair" }).click();
  await expect(page.getByText("Invariant violated", { exact: true })).toBeVisible();
});

test("mobile learning loop keeps all five steps in viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".loop-strip > span").nth(4)).toContainText("Prove");
  const metrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport);
});
