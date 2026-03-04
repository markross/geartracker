import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncStravaActivities, processSingleActivity } from "./sync";
import type { User } from "./types";

vi.mock("./strava/token", () => ({
  getValidStravaToken: vi.fn(),
}));

vi.mock("./strava/activities", () => ({
  fetchAllStravaActivities: vi.fn(),
}));

vi.mock("./strava/gear", () => ({
  fetchStravaGear: vi.fn(),
  stravaGearDisplayName: vi.fn(),
}));

vi.mock("./bikes", () => ({
  getBikes: vi.fn(),
  createBike: vi.fn(),
}));

vi.mock("./rides", () => ({
  getRides: vi.fn(),
  createRide: vi.fn(),
}));

import { getValidStravaToken } from "./strava/token";
import { fetchAllStravaActivities } from "./strava/activities";
import { fetchStravaGear, stravaGearDisplayName } from "./strava/gear";
import { getBikes, createBike } from "./bikes";
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

function createMockSupabase(insertResult: { data: any; error: any } = { data: [], error: null }) {
  const mockSelect = vi.fn().mockResolvedValue(insertResult);
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
  return {
    from: vi.fn().mockReturnValue({ insert: mockInsert }),
    _mockInsert: mockInsert,
    _mockSelect: mockSelect,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getValidStravaToken).mockResolvedValue("token-123");
});

describe("syncStravaActivities", () => {
  it("imports new ride activities via batch insert", async () => {
    const mockSupabase = createMockSupabase({
      data: [{ id: "ride-1" }],
      error: null,
    });

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

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result).toEqual({ fetched: 1, imported: 1, skipped: 0, errors: 0, bikes_created: 0 });
    expect(mockSupabase.from).toHaveBeenCalledWith("rides");
    expect(mockSupabase._mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: "user-1",
        strava_activity_id: 100,
        name: "Morning Ride",
        distance_km: 42.5,
      }),
    ]);
  });

  it("skips already-imported activities", async () => {
    const mockSupabase = createMockSupabase();

    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 100, name: "Ride", distance: 10000, moving_time: 1800, start_date: "2026-03-01T08:00:00Z", gear_id: null, type: "Ride" },
    ]);
    vi.mocked(getRides).mockResolvedValue({
      data: [{ strava_activity_id: 100 }],
      error: null,
    } as any);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result).toEqual({ fetched: 1, imported: 0, skipped: 1, errors: 0, bikes_created: 0 });
    // Should not call insert when all rides are skipped
    expect(mockSupabase.from).not.toHaveBeenCalledWith("rides");
  });

  it("matches activities to bikes by gear_id", async () => {
    const mockSupabase = createMockSupabase({
      data: [{ id: "ride-1" }],
      error: null,
    });

    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 200, name: "Ride", distance: 20000, moving_time: 3600, start_date: "2026-03-01T08:00:00Z", gear_id: "b12345", type: "Ride" },
    ]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({
      data: [{ id: "bike-1", strava_gear_id: "b12345" }],
      error: null,
    } as any);

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result.imported).toBe(1);
    expect(mockSupabase._mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({ bike_id: "bike-1" }),
    ]);
  });

  it("filters out non-ride activities", async () => {
    const mockSupabase = createMockSupabase({
      data: [{ id: "ride-1" }],
      error: null,
    });

    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 300, name: "Run", distance: 5000, moving_time: 1200, start_date: "2026-03-01T08:00:00Z", gear_id: null, type: "Run" },
      { id: 301, name: "Ride", distance: 10000, moving_time: 1800, start_date: "2026-03-01T08:00:00Z", gear_id: null, type: "Ride" },
    ]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result).toEqual({ fetched: 1, imported: 1, skipped: 0, errors: 0, bikes_created: 0 });
  });

  it("includes VirtualRide activities", async () => {
    const mockSupabase = createMockSupabase({
      data: [{ id: "ride-1" }],
      error: null,
    });

    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 400, name: "Zwift", distance: 30000, moving_time: 3600, start_date: "2026-03-01T08:00:00Z", gear_id: null, type: "VirtualRide" },
    ]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result).toEqual({ fetched: 1, imported: 1, skipped: 0, errors: 0, bikes_created: 0 });
  });

  it("throws when batch insert fails", async () => {
    const mockSupabase = createMockSupabase({
      data: null,
      error: { message: "Insert failed" },
    });

    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 500, name: "Ride", distance: 10000, moving_time: 1800, start_date: "2026-03-01T08:00:00Z", gear_id: null, type: "Ride" },
    ]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);

    await expect(
      syncStravaActivities(mockSupabase, mockUser, "cid", "csec")
    ).rejects.toThrow("Failed to insert rides: Insert failed");
  });

  it("throws when getRides fails", async () => {
    const mockSupabase = createMockSupabase();

    vi.mocked(fetchAllStravaActivities).mockResolvedValue([]);
    vi.mocked(getRides).mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    } as any);

    await expect(
      syncStravaActivities(mockSupabase, mockUser, "cid", "csec")
    ).rejects.toThrow("Failed to fetch existing rides");
  });

  it("throws when getBikes fails", async () => {
    const mockSupabase = createMockSupabase();

    vi.mocked(fetchAllStravaActivities).mockResolvedValue([]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    } as any);

    await expect(
      syncStravaActivities(mockSupabase, mockUser, "cid", "csec")
    ).rejects.toThrow("Failed to fetch bikes");
  });

  it("auto-creates bikes for unknown gear_ids", async () => {
    const mockSupabase = createMockSupabase({
      data: [{ id: "ride-1" }],
      error: null,
    });

    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 600, name: "Ride", distance: 20000, moving_time: 3600, start_date: "2026-03-01T08:00:00Z", gear_id: "b99999", type: "Ride" },
    ]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(fetchStravaGear).mockResolvedValue({
      id: "b99999", name: "My Bike", brand_name: "Trek", model_name: "Domane", distance: 50000,
    });
    vi.mocked(stravaGearDisplayName).mockReturnValue("Trek Domane");
    vi.mocked(createBike).mockResolvedValue({
      data: { id: "bike-new", user_id: "user-1", name: "Trek Domane", strava_gear_id: "b99999", is_active: true, created_at: "2026-01-01" },
      error: null,
    } as any);

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result.bikes_created).toBe(1);
    expect(createBike).toHaveBeenCalledWith(mockSupabase, {
      user_id: "user-1",
      name: "Trek Domane",
      strava_gear_id: "b99999",
    });
    // Ride should be linked to the newly created bike
    expect(mockSupabase._mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({ bike_id: "bike-new" }),
    ]);
  });

  it("does not duplicate bikes for already-known gear_ids", async () => {
    const mockSupabase = createMockSupabase({
      data: [{ id: "ride-1" }],
      error: null,
    });

    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 700, name: "Ride", distance: 20000, moving_time: 3600, start_date: "2026-03-01T08:00:00Z", gear_id: "b12345", type: "Ride" },
    ]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({
      data: [{ id: "bike-1", strava_gear_id: "b12345" }],
      error: null,
    } as any);

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result.bikes_created).toBe(0);
    expect(fetchStravaGear).not.toHaveBeenCalled();
    expect(createBike).not.toHaveBeenCalled();
  });

  it("continues if gear fetch fails for one gear_id", async () => {
    const mockSupabase = createMockSupabase({
      data: [{ id: "ride-1" }],
      error: null,
    });

    vi.mocked(fetchAllStravaActivities).mockResolvedValue([
      { id: 800, name: "Ride", distance: 20000, moving_time: 3600, start_date: "2026-03-01T08:00:00Z", gear_id: "b_bad", type: "Ride" },
    ]);
    vi.mocked(getRides).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(fetchStravaGear).mockRejectedValue(new Error("Strava API error: 404"));

    const result = await syncStravaActivities(mockSupabase, mockUser, "cid", "csec");

    expect(result.bikes_created).toBe(0);
    expect(result.imported).toBe(1);
    // Ride should have null bike_id since gear fetch failed
    expect(mockSupabase._mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({ bike_id: null }),
    ]);
  });
});

function createSingleActivitySupabase(dedupResult: { data: any } = { data: null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(dedupResult),
  };
  return { from: vi.fn().mockReturnValue(chain), _chain: chain } as any;
}

describe("processSingleActivity", () => {
  const mockActivity = {
    id: 100,
    name: "Morning Ride",
    distance: 42500,
    moving_time: 5400,
    start_date: "2026-03-01T08:00:00Z",
    gear_id: null as string | null,
    type: "Ride",
  };

  it("imports a new ride activity", async () => {
    const mockSupabase = createSingleActivitySupabase({ data: null });
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(createRide).mockResolvedValue({ data: { id: "ride-1" }, error: null } as any);

    const result = await processSingleActivity(mockSupabase, mockUser, mockActivity, "token-123");

    expect(result).toEqual({ action: "imported", bike_created: false });
    expect(createRide).toHaveBeenCalledWith(mockSupabase, expect.objectContaining({
      user_id: "user-1",
      strava_activity_id: 100,
      distance_km: 42.5,
    }));
  });

  it("skips already-imported activities", async () => {
    const mockSupabase = createSingleActivitySupabase({ data: { id: "ride-existing" } });

    const result = await processSingleActivity(mockSupabase, mockUser, mockActivity, "token-123");

    expect(result).toEqual({ action: "skipped", bike_created: false });
    expect(createRide).not.toHaveBeenCalled();
  });

  it("ignores non-ride activities", async () => {
    const mockSupabase = {} as any;
    const runActivity = { ...mockActivity, type: "Run" };

    const result = await processSingleActivity(mockSupabase, mockUser, runActivity, "token-123");

    expect(result).toEqual({ action: "ignored", bike_created: false });
    expect(createRide).not.toHaveBeenCalled();
  });

  it("auto-creates bike for unknown gear_id", async () => {
    const mockSupabase = createSingleActivitySupabase({ data: null });
    const activityWithGear = { ...mockActivity, gear_id: "b99999" };

    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(fetchStravaGear).mockResolvedValue({
      id: "b99999", name: "My Bike", brand_name: "Trek", model_name: "Domane", distance: 50000,
    });
    vi.mocked(stravaGearDisplayName).mockReturnValue("Trek Domane");
    vi.mocked(createBike).mockResolvedValue({
      data: { id: "bike-new", user_id: "user-1", name: "Trek Domane", strava_gear_id: "b99999", is_active: true, created_at: "2026-01-01" },
      error: null,
    } as any);
    vi.mocked(createRide).mockResolvedValue({ data: { id: "ride-1" }, error: null } as any);

    const result = await processSingleActivity(mockSupabase, mockUser, activityWithGear, "token-123");

    expect(result).toEqual({ action: "imported", bike_created: true });
    expect(createRide).toHaveBeenCalledWith(mockSupabase, expect.objectContaining({ bike_id: "bike-new" }));
  });

  it("matches existing bike by gear_id", async () => {
    const mockSupabase = createSingleActivitySupabase({ data: null });
    const activityWithGear = { ...mockActivity, gear_id: "b12345" };

    vi.mocked(getBikes).mockResolvedValue({
      data: [{ id: "bike-1", strava_gear_id: "b12345" }],
      error: null,
    } as any);
    vi.mocked(createRide).mockResolvedValue({ data: { id: "ride-1" }, error: null } as any);

    const result = await processSingleActivity(mockSupabase, mockUser, activityWithGear, "token-123");

    expect(result).toEqual({ action: "imported", bike_created: false });
    expect(createRide).toHaveBeenCalledWith(mockSupabase, expect.objectContaining({ bike_id: "bike-1" }));
  });
});
