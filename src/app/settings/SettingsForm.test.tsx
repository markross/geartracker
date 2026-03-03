import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SettingsForm from "./SettingsForm";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("SettingsForm", () => {
  it("renders with initial unit selected", () => {
    render(<SettingsForm initialUnit="km" />);
    const kmRadio = screen.getByLabelText("Kilometers (km)") as HTMLInputElement;
    const miRadio = screen.getByLabelText("Miles (mi)") as HTMLInputElement;
    expect(kmRadio.checked).toBe(true);
    expect(miRadio.checked).toBe(false);
  });

  it("disables save when unit unchanged", () => {
    render(<SettingsForm initialUnit="km" />);
    expect(screen.getByText("Save")).toBeDisabled();
  });

  it("enables save when unit changed", () => {
    render(<SettingsForm initialUnit="km" />);
    fireEvent.click(screen.getByLabelText("Miles (mi)"));
    expect(screen.getByText("Save")).toBeEnabled();
  });

  it("calls PATCH on save and shows success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ distance_unit: "mi" }), { status: 200 })
    );

    render(<SettingsForm initialUnit="km" />);
    fireEvent.click(screen.getByLabelText("Miles (mi)"));
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText("Settings saved")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith("/api/settings", expect.objectContaining({
      method: "PATCH",
    }));
  });

  it("shows error on failed save", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Server error" }), { status: 500 })
    );

    render(<SettingsForm initialUnit="km" />);
    fireEvent.click(screen.getByLabelText("Miles (mi)"));
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });
});
