import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchStravaGear, stravaGearDisplayName, type StravaGear } from "./gear";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchStravaGear", () => {
  it("fetches gear by id", async () => {
    const gear: StravaGear = {
      id: "b12345",
      name: "My Bike",
      brand_name: "Trek",
      model_name: "Domane SL6",
      distance: 150000,
    };
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(gear) });

    const result = await fetchStravaGear("token-123", "b12345");

    expect(result).toEqual(gear);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.strava.com/api/v3/gear/b12345",
      { headers: { Authorization: "Bearer token-123" } }
    );
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    await expect(fetchStravaGear("token", "bad-id")).rejects.toThrow("Strava API error: 404");
  });
});

describe("stravaGearDisplayName", () => {
  it("combines brand and model", () => {
    const gear: StravaGear = { id: "b1", name: "Fallback", brand_name: "Trek", model_name: "Domane", distance: 0 };
    expect(stravaGearDisplayName(gear)).toBe("Trek Domane");
  });

  it("uses brand only if no model", () => {
    const gear: StravaGear = { id: "b1", name: "Fallback", brand_name: "Specialized", model_name: "", distance: 0 };
    expect(stravaGearDisplayName(gear)).toBe("Specialized");
  });

  it("falls back to name if no brand or model", () => {
    const gear: StravaGear = { id: "b1", name: "My Bike", brand_name: "", model_name: "", distance: 0 };
    expect(stravaGearDisplayName(gear)).toBe("My Bike");
  });
});
