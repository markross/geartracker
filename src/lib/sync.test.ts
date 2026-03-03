import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncStravaActivities } from "./sync";
import type { User } from "./types";

vi.mock("./strava/token", () => ({
  getValidStravaToken: vi.fn(),
}));

vi.mock("./strava/activities", () => ({
  fetchAllStravaActivities: vi.fn(),
}));

vi.mock("./bikes", () => ({
  getBikes: vi.fn(),
}));

vi.mock("./rides", () => ({
  getRides: vi.fn(),
  createRide: vi.fn(),
}));

import { getValidStravaToken } from "./strava/token";
import { fetchAllStravaActivities } from "./strava/activities";
import { getBikes } from "./bikes";
import { getRides, createRide } from "./rides";

const mockUser: User = {
  id: "user-1",
  email: "test@example.com",
  strava_athlete_id: 12345,
  strava_access_token: "token-123",
  strava_refresh_token: "refresh-456",
  strava_token_expires_at: new Date(Date.now() + 3600000).toISOString(),
  distance_unit: "km",
  created_at: "2026-01-01T00:00:00Z",
};

const mockSupabase = {} as any;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getValidStravaToken).mockResolvedValue("token-123");
});

describe("syncStravaActivities", () => {
  it("imports new ride activities", async () => {
    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      {
        id: 100,
        name: "Morning Ride",
        distance: 42500,
        moving_time: 5400,
        start_date: "2026-03-01T08:00:00Z",
        gear_id: null,
        type: "Ride",
      },
    ]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(createRide).mockResolvedValue({ data: {}, error: null } as any);

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result).toEqual({ fetched: 1, imported: 1, skipped: 0 });
    expect(createRide).toHaveBeenCalledWith(mockSupabase, {
      user_id: "user-1",
      strava_activity_id: 100,
      name: "Morning Ride",
      distance_km: 42.5,
      moving_time_seconds: 5400,
      started_at: "2026-03-01T08:00:00Z",
      bike_id: null,
    });
  });

  it("skips already-imported activities", async () => {
    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 100, name: "Ride", distance: 10000, moving_time: 1800, start_date: "2026-03-01T08:00:00Z", gear_id: null, type: "Ride" },
    ]);
    vi.mocked(getRides).mockResolvedValue({
      data: [{ strava_activity_id: 100 }],
      error: null,
    } as any);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result).toEqual({ fetched: 1, imported: 0, skipped: 1 });
    expect(createRide).not.toHaveBeenCalled();
  });

  it("matches activities to bikes by gear_id", async () => {
    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 200, name: "Ride", distance: 20000, moving_time: 3600, start_date: "2026-03-01T08:00:00Z", gear_id: "b12345", type: "Ride" },
    ]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({
      data: [{ id: "bike-1", strava_gear_id: "b12345" }],
      error: null,
    } as any);
    vi.mocked(createRide).mockResolvedValue({ data: {}, error: null } as any);

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result.imported).toBe(1);
    expect(createRide).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({ bike_id: "bike-1" })
    );
  });

  it("filters out non-ride activities", async () => {
    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 300, name: "Run", distance: 5000, moving_time: 1200, start_date: "2026-03-01T08:00:00Z", gear_id: null, type: "Run" },
      { id: 301, name: "Ride", distance: 10000, moving_time: 1800, start_date: "2026-03-01T08:00:00Z", gear_id: null, type: "Ride" },
    ]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(createRide).mockResolvedValue({ data: {}, error: null } as any);

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result).toEqual({ fetched: 1, imported: 1, skipped: 0 });
  });

  it("includes VirtualRide activities", async () => {
    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 400, name: "Zwift", distance: 30000, moving_time: 3600, start_date: "2026-03-01T08:00:00Z", gear_id: null, type: "VirtualRide" },
    ]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(createRide).mockResolvedValue({ data: {}, error: null } as any);

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result).toEqual({ fetched: 1, imported: 1, skipped: 0 });
  });
});
