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

  await choose(page, "Add a loading indicator");
  await expect(page.getByText("Hypothesis", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Test selected repair" })).toBeEnabled();
  await expect(page.locator('.loop-strip [aria-current="step"]')).toContainText("Prove");
  await expect(page.getByRole("region", { name: "Source under test" })).toContainText(
    "Abort stale request in cleanup",
  );
});

test("diagnoses and repairs Missing Cleanup", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Missing cleanup" }).click();
  await choose(page, "Old and replacement timers both run");
  await runBug(page);
  await expect(page.getByText("Component unmounted", { exact: true })).toHaveCount(0);
  await expect(page.getByText("instance-2 committed as unmounted.", { exact: true })).toHaveCount(0);

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
  await expect(page.getByText("Component unmounted", { exact: true })).toHaveCount(0);
  await expect(page.getByText("instance-2 committed as unmounted.", { exact: true })).toHaveCount(0);
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

test("main-thread stall preserves the controlled C-before-B race", async ({ page }) => {
  await page.goto("/");
  await choose(page, "Todo C appears, then B overwrites it");
  await page.getByRole("button", { name: "Run bug sequence" }).click();
  await page.evaluate(() => {
    const end = performance.now() + 1_600;
    while (performance.now() < end) {
      // Reproduce background throttling or a long main-thread task.
    }
  });

  await expect(page.getByText("Invariant violated", { exact: true })).toBeVisible();
  const kinds = await page.locator(".timeline__meta strong").allTextContents();
  expect(kinds.indexOf("state write")).toBeGreaterThan(-1);
  expect(kinds.indexOf("stale write")).toBeGreaterThan(kinds.indexOf("state write"));
  await expect(page.getByText("Your prediction matched the observed bug trace.")).toBeVisible();
  await expect(page.getByLabel("Visible todo")).toHaveText("Todo B");
});

test("GPT-5.6 coaching cites and focuses validated runtime evidence", async ({ page }) => {
  let requestCount = 0;
  await page.route("**/api/analyze", async (route) => {
    requestCount += 1;
    const attempt = route.request().postDataJSON() as {
      trace: Array<{ id: string; kind: string }>;
    };
    const evidenceId = attempt.trace.find((event) => event.kind === "stale_write")?.id;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        feedback: {
          verdict: "correct",
          misconception: "You correctly treated response arrival order as independent from selection order.",
          evidence: [
            {
              eventId: evidenceId,
              explanation: "The stale B callback performed the final state write.",
            },
          ],
          hint: "Invalidate request work when its owning effect is cleaned up.",
          transferQuestion: {
            prompt: "Which boundary can make request B obsolete?",
            options: ["Effect cleanup", "Loading state"],
          },
        },
        model: "gpt-5.6-terra",
        requestId: "mock-request-1",
      }),
    });
  });

  await page.goto("/");
  await choose(page, "Todo C appears, then B overwrites it");
  await runBug(page);
  await page.getByRole("button", { name: "Ask GPT-5.6 coach" }).click();

  await expect(page.getByText(/response arrival order as independent/i)).toBeVisible();
  const evidence = page.locator(".model-evidence button");
  await evidence.click();
  const highlighted = page.locator(".timeline__event.is-highlighted");
  await expect(highlighted).toContainText("stale write", { ignoreCase: true });
  await expect(highlighted).toBeFocused();

  await page.getByRole("button", { name: "Recheck coaching" }).click();
  await page.waitForTimeout(50);
  expect(requestCount).toBe(1);
});

test("model failure leaves deterministic coaching intact", async ({ page }) => {
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Model coaching is not configured. Deterministic evidence remains available.",
      }),
    }),
  );
  await page.goto("/");
  await choose(page, "Todo C appears, then B overwrites it");
  await runBug(page);
  await page.getByRole("button", { name: "Ask GPT-5.6 coach" }).click();

  await expect(page.getByRole("alert")).toContainText("Deterministic evidence remains available");
  await expect(page.getByText("Invariant violated", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry GPT-5.6 coach" })).toBeEnabled();
});

test("reset aborts pending model coaching without a late update", async ({ page }) => {
  let releaseResponse: (() => void) | undefined;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route("**/api/analyze", async (route) => {
    await responseGate;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "This late response must be ignored." }),
    }).catch(() => undefined);
  });

  await page.goto("/");
  await choose(page, "Todo C appears, then B overwrites it");
  await runBug(page);
  await page.getByRole("button", { name: "Ask GPT-5.6 coach" }).click();
  await expect(page.getByText("GPT-5.6 analyzing", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Reset" }).click();
  releaseResponse?.();
  await page.waitForTimeout(100);

  await expect(page.getByText("GPT-5.6 analyzing", { exact: true })).toHaveCount(0);
  await expect(page.getByText("This late response must be ignored.")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
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
