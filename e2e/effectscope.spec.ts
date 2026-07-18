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
  await expect(page.getByText("Running", { exact: true })).toBeVisible();
  await expect(page.getByText("Rejected", { exact: true })).toBeVisible();
  await expect(page.getByText("Invariant violated", { exact: true })).toBeVisible();
  await expect(page.locator('.loop-strip [aria-current="step"]')).toContainText("Repair");
  await expect(page.getByRole("button", { name: "Choose another repair" })).toBeDisabled();

  await page.getByRole("button", { name: "Missing cleanup" }).click();
  await choose(page, "Old and replacement timers both run");
  await runBug(page);
  await choose(page, "Start a second timer on mount");
  await page.getByRole("button", { name: "Test selected repair" }).click();
  await expect(page.getByText("Running", { exact: true })).toBeVisible();
  await expect(page.getByText("Rejected", { exact: true })).toBeVisible();
  await expect(page.getByText("Invariant violated", { exact: true })).toBeVisible();
});

test("keyboard execution exposes visible focus at failure and proof", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: /Todo C appears, then B overwrites it/i }).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Run bug sequence" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Invariant violated", { exact: true })).toBeVisible();

  const repairHeading = page.getByRole("heading", { name: "Choose the smallest repair" });
  await expect(repairHeading).toBeFocused();
  await expect(repairHeading).toHaveCSS("outline-style", "solid");
  await expect(repairHeading).toHaveCSS("outline-width", "2px");

  await page.getByRole("radio", { name: /Abort and guard obsolete requests/i }).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Test selected repair" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Invariant proved", { exact: true })).toBeVisible();

  const verdict = page.locator(".verdict");
  await expect(verdict).toBeFocused();
  await expect(verdict).toHaveCSS("outline-style", "solid");
  await expect(verdict).toHaveCSS("outline-width", "2px");
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
