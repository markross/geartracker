import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("renders the app name", () => {
    render(<Home />);
    expect(screen.getByText("GearTracker")).toBeInTheDocument();
  });

  it("renders a tagline", () => {
    render(<Home />);
    expect(
      screen.getByText(/track wear on your bike components/i)
    ).toBeInTheDocument();
  });
});
