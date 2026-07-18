import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  vi.useRealTimers();
});

async function advance(delayMs: number) {
  await act(async () => {
    vi.advanceTimersByTime(delayMs);
  });
}

function choose(name: RegExp) {
  fireEvent.click(screen.getByRole("radio", { name }));
}

function runBug() {
  fireEvent.click(screen.getByRole("button", { name: "Run bug sequence" }));
}

describe("EffectScope diagnosis workspace", () => {
  it("renders both scenarios and gates execution on a prediction", () => {
    render(<App />);

    expect(
      screen.getByRole("link", { name: "Jump to EffectScope workspace" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Effect scenarios" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fetch race/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Run bug sequence" })).toBeDisabled();
    expect(screen.getByText("Needs prediction")).toBeInTheDocument();

    choose(/Only Todo C remains visible/i);

    expect(screen.getByRole("button", { name: "Run bug sequence" })).toBeEnabled();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Run");
  });

  it("runs, diagnoses, explains, repairs, and proves Fetch Race", async () => {
    vi.useFakeTimers();
    render(<App />);
    choose(/Only Todo C remains visible/i);
    runBug();

    await advance(2_000);

    expect(screen.getByText("Invariant violated")).toBeInTheDocument();
    expect(screen.getByText(/Stale request B overwrote/i)).toBeInTheDocument();
    expect(screen.getByText("Your prediction missed the observed bug trace.")).toBeInTheDocument();
    expect(screen.getByText(/Todo C appears first.*Todo B response then overwrites/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Choose the smallest repair" })).toHaveFocus();

    choose(/Abort and guard obsolete requests/i);
    expect(
      within(screen.getByRole("region", { name: "Source under test" })).getByText(
        "No request cleanup",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Test selected repair" }));
    expect(screen.getByText("Abort stale request in cleanup")).toBeInTheDocument();

    await advance(2_000);

    expect(screen.getByText("Invariant proved")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 proved once")).toBeInTheDocument();
    expect(screen.getByLabelText("Visible todo")).toHaveTextContent("Todo C");
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retest verified repair" })).toBeEnabled();
    expect(screen.getByText("Invariant proved").closest(".verdict")).toHaveFocus();
  });

  it("runs and proves Missing Cleanup with one coalesced timer advance", async () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Missing cleanup/i }));
    choose(/Old and replacement timers both run/i);
    runBug();

    await advance(5_000);

    expect(screen.getByText("Invariant violated")).toBeInTheDocument();
    expect(screen.getByText("Your prediction matched the observed bug trace.")).toBeInTheDocument();
    choose(/Clear the interval in cleanup/i);
    fireEvent.click(screen.getByRole("button", { name: "Test selected repair" }));

    await advance(5_000);

    expect(screen.getByText("Invariant proved")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 proved once")).toBeInTheDocument();
  });

  it.each([
    {
      scenario: "fetch-race" as const,
      open: null,
      prediction: /Todo C appears, then B overwrites it/i,
      advanceBeforeReset: 100,
    },
    {
      scenario: "missing-cleanup" as const,
      open: /Missing cleanup/i,
      prediction: /Old and replacement timers both run/i,
      advanceBeforeReset: 510,
    },
  ])("cancels $scenario safely when reset during a run", async ({ open, prediction, advanceBeforeReset }) => {
    vi.useFakeTimers();
    render(<App />);
    if (open) fireEvent.click(screen.getByRole("button", { name: open }));
    choose(prediction);
    runBug();
    await advance(advanceBeforeReset);

    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await advance(5_000);

    expect(screen.queryByRole("log", { name: "Runtime events" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Invariant (proved|violated)/)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("disposes a running scenario before switching scenarios", async () => {
    vi.useFakeTimers();
    render(<App />);
    choose(/Todo C appears, then B overwrites it/i);
    runBug();
    await advance(100);

    fireEvent.click(screen.getByRole("button", { name: /Missing cleanup/i }));
    await advance(5_000);

    expect(screen.getByRole("heading", { name: "The timer that outlived its component" })).toBeInTheDocument();
    expect(screen.queryByRole("log", { name: "Runtime events" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps candidate source pending and demonstrates a distractor failure", async () => {
    vi.useFakeTimers();
    render(<App />);
    choose(/Todo C appears, then B overwrites it/i);
    runBug();
    await advance(2_000);

    choose(/Add a loading indicator/i);
    expect(
      within(screen.getByRole("region", { name: "Source under test" })).getByText(
        "No request cleanup",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Test selected repair" }));
    expect(screen.getByText("Add a loading state")).toBeInTheDocument();
    await advance(2_000);

    expect(screen.getByText("Invariant violated")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
