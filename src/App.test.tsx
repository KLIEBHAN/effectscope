import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("EffectScope baseline shell", () => {
  it("renders English product branding and navigation", () => {
    render(<App />);

    expect(screen.getByText("EffectScope")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Concept lessons" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeEnabled();
  });
});
