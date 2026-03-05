import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BikeRideList from "./BikeRideList";
import type { Ride, Bike } from "@/lib/types";

const bikes: Bike[] = [
  { id: "bike-1", user_id: "u1", name: "Road Bike", strava_gear_id: null, is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "bike-2", user_id: "u1", name: "MTB", strava_gear_id: null, is_active: true, created_at: "2026-01-01T00:00:00Z" },
];

const rides: Ride[] = [
  { id: "r1", user_id: "u1", bike_id: "bike-1", strava_activity_id: null, name: "Morning Ride", distance_km: 50, moving_time_seconds: 3600, started_at: "2026-03-01T08:00:00Z", created_at: "2026-03-01T08:00:00Z" },
  { id: "r2", user_id: "u1", bike_id: "bike-1", strava_activity_id: null, name: "Evening Ride", distance_km: 30, moving_time_seconds: 2400, started_at: "2026-03-02T18:00:00Z", created_at: "2026-03-02T18:00:00Z" },
];

const defaultProps = {
  rides,
  bikes,
  currentBikeId: "bike-1",
  distanceUnit: "km" as const,
};

describe("BikeRideList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders ride names and distances", () => {
    render(<BikeRideList {...defaultProps} />);
    expect(screen.getByText("Morning Ride")).toBeInTheDocument();
    expect(screen.getByText("Evening Ride")).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it("shows empty message when no rides", () => {
    render(<BikeRideList {...defaultProps} rides={[]} />);
    expect(screen.getByText(/no rides/i)).toBeInTheDocument();
  });

  it("shows ride count", () => {
    render(<BikeRideList {...defaultProps} />);
    expect(screen.getByText(/2 rides/)).toBeInTheDocument();
  });

  it("renders reassign dropdown for each ride", () => {
    render(<BikeRideList {...defaultProps} />);
    const selects = screen.getAllByTestId("reassign-select");
    expect(selects).toHaveLength(2);
  });

  it("reassign dropdown has other bikes as options", () => {
    render(<BikeRideList {...defaultProps} />);
    const selects = screen.getAllByTestId("reassign-select");
    // Each select should have: current bike disabled label + other bikes + unassign option
    const options = selects[0].querySelectorAll("option");
    expect(options.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("MTB").length).toBeGreaterThanOrEqual(1);
  });

  it("calls PATCH when reassigning a ride", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch;

    render(<BikeRideList {...defaultProps} />);
    const selects = screen.getAllByTestId("reassign-select");
    fireEvent.change(selects[0], { target: { value: "bike-2" } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/rides/r1", expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ bike_id: "bike-2" }),
      }));
    });
  });

  it("removes ride from list after successful reassign", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch;

    render(<BikeRideList {...defaultProps} />);
    const selects = screen.getAllByTestId("reassign-select");
    fireEvent.change(selects[0], { target: { value: "bike-2" } });

    await waitFor(() => {
      expect(screen.queryByText("Morning Ride")).not.toBeInTheDocument();
    });
  });

  it("allows unassigning a ride", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch;

    render(<BikeRideList {...defaultProps} />);
    const selects = screen.getAllByTestId("reassign-select");
    fireEvent.change(selects[0], { target: { value: "__unassign__" } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/rides/r1", expect.objectContaining({
        body: JSON.stringify({ bike_id: null }),
      }));
    });
  });
});
