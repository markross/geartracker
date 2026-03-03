import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchStravaActivities, fetchAllStravaActivities } from "./activities";

beforeEach(() => {
  vi.restoreAllMocks();
});

const mockActivity = {
  id: 123,
  name: "Morning Ride",
  distance: 42500,
  moving_time: 5400,
  start_date: "2026-03-01T08:00:00Z",
  gear_id: "b12345",
  type: "Ride",
};

describe("fetchStravaActivities", () => {
  it("fetches activities with auth header", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify([mockActivity]), { status: 200 })
    );

    const result = await fetchStravaActivities("token-123");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/athlete/activities"),
      expect.objectContaining({
        headers: { Authorization: "Bearer token-123" },
      })
    );
    expect(result).toEqual([mockActivity]);
  });

  it("passes after param when provided", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );

    await fetchStravaActivities("token-123", 1700000000);

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("after=1700000000");
  });

  it("throws on API error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("Unauthorized", { status: 401 })
    );

    await expect(fetchStravaActivities("bad-token")).rejects.toThrow("Strava API error: 401");
  });
});

describe("fetchAllStravaActivities", () => {
  it("paginates until fewer than 100 results", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({ ...mockActivity, id: i }));
    const page2 = [{ ...mockActivity, id: 100 }];

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(page1), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(page2), { status: 200 }));

    const result = await fetchAllStravaActivities("token-123");

    expect(result).toHaveLength(101);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("returns single page if fewer than 100", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify([mockActivity]), { status: 200 })
    );

    const result = await fetchAllStravaActivities("token-123");

    expect(result).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
