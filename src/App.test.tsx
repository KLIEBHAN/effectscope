import { act, fireEvent, render, screen } from "@testing-library/react";
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

async function completeFetchRun() {
  await advance(100);
  await advance(250);
  await advance(1_100);
}

async function completeCleanupRun() {
  await advance(580);
  await advance(120);
  await advance(520);
  await advance(180);
}

describe("EffectScope diagnosis workspace", () => {
  it("renders both scenarios and gates execution on a prediction", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "EffectScope home" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Effect scenarios" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fetch race/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Run bug sequence" })).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: /Only Todo C remains visible/i }));

    expect(screen.getByRole("button", { name: "Run bug sequence" })).toBeEnabled();
  });

  it("runs, diagnoses, repairs, and proves the Fetch Race", async () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("radio", { name: /Only Todo C remains visible/i }));
    fireEvent.click(screen.getByRole("button", { name: "Run bug sequence" }));

    await completeFetchRun();

    expect(screen.getByText("Invariant violated")).toBeInTheDocument();
    expect(screen.getByText(/Stale request B overwrote/i)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("radio", { name: /Abort and guard obsolete requests/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Test selected repair" }));

    await completeFetchRun();

    expect(screen.getByText("Invariant proved")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 proved")).toBeInTheDocument();
    expect(screen.getByLabelText("Visible todo")).toHaveTextContent("Todo C");
  });

  it("runs and proves Missing Cleanup with the clearInterval repair", async () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Missing cleanup/i }));
    fireEvent.click(screen.getByRole("radio", { name: /Only the replacement timer runs/i }));
    fireEvent.click(screen.getByRole("button", { name: "Run bug sequence" }));

    await completeCleanupRun();

    expect(screen.getByText("Invariant violated")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Clear the interval in cleanup/i }));
    fireEvent.click(screen.getByRole("button", { name: "Test selected repair" }));

    await completeCleanupRun();

    expect(screen.getByText("Invariant proved")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 proved")).toBeInTheDocument();
  });
});
