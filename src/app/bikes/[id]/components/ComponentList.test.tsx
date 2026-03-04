import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ComponentList from "./ComponentList";
import type { Component } from "@/lib/types";

const mockComponent: Component = {
  id: "comp-1",
  bike_id: "bike-1",
  name: "KMC X11",
  type: "chain",
  max_distance_km: 5000,
  installed_at: "2026-01-01T00:00:00Z",
  retired_at: null,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ComponentList", () => {
  it("renders empty state", () => {
    render(<ComponentList bikeId="bike-1" initialComponents={[]} distanceUnit="km" />);
    expect(screen.getByText(/no components yet/i)).toBeInTheDocument();
    expect(screen.getByText("Add Component")).toBeInTheDocument();
  });

  it("renders components", () => {
    render(<ComponentList bikeId="bike-1" initialComponents={[mockComponent]} distanceUnit="km" />);
    expect(screen.getByText("KMC X11")).toBeInTheDocument();
  });

  it("shows form when Add Component clicked", () => {
    render(<ComponentList bikeId="bike-1" initialComponents={[]} distanceUnit="km" />);
    fireEvent.click(screen.getByText("Add Component"));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("creates a component via API", async () => {
    const created = { ...mockComponent, id: "comp-2", name: "Shimano 105" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ component: created }),
      })
    );

    render(<ComponentList bikeId="bike-1" initialComponents={[]} distanceUnit="km" />);
    fireEvent.click(screen.getByText("Add Component"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Shimano 105" } });
    fireEvent.change(screen.getByLabelText("Max Distance (km)"), { target: { value: "8000" } });
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText("Shimano 105")).toBeInTheDocument();
    });
  });

  it("deletes a component via API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true })
    );

    render(<ComponentList bikeId="bike-1" initialComponents={[mockComponent]} distanceUnit="km" />);
    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(screen.queryByText("KMC X11")).not.toBeInTheDocument();
    });
  });

  it("retires a component via API", async () => {
    const retired = { ...mockComponent, retired_at: "2026-03-02T00:00:00Z" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ component: retired }),
      })
    );

    render(<ComponentList bikeId="bike-1" initialComponents={[mockComponent]} distanceUnit="km" />);
    fireEvent.click(screen.getByText("Retire"));
    fireEvent.click(screen.getByText("Confirm Retire"));

    await waitFor(() => {
      expect(screen.getByText("Retired")).toBeInTheDocument();
    });
  });
});