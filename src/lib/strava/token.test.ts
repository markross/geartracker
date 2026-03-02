import { describe, it, expect, vi, beforeEach } from "vitest";
import { getValidStravaToken } from "./token";

beforeEach(() => {
  vi.restoreAllMocks();
});

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  strava_athlete_id: 12345,
  strava_access_token: "current-token",
  strava_refresh_token: "refresh-token",
  strava_token_expires_at: "",
  distance_unit: "km" as const,
  created_at: "2026-01-01T00:00:00Z",
};

const mockEq = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn(() => ({
  update: mockUpdate,
}));
const mockSupabase = { from: mockFrom } as any;

describe("getValidStravaToken", () => {
  beforeEach(() => {
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
  });

  it("returns current token if not expired", async () => {
    const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
    const user = { ...mockUser, strava_token_expires_at: futureDate };

    const result = await getValidStravaToken(
      user,
      mockSupabase,
      "client-123",
      "secret-abc"
    );

    expect(result).toBe("current-token");
    // Supabase should not have been called (no refresh needed)
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("refreshes and returns new token if expired", async () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const user = { ...mockUser, strava_token_expires_at: pastDate };

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "new-token",
          refresh_token: "new-refresh",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
        { status: 200 }
      )
    );

    const result = await getValidStravaToken(
      user,
      mockSupabase,
      "client-123",
      "secret-abc"
    );

    expect(result).toBe("new-token");
    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        strava_access_token: "new-token",
        strava_refresh_token: "new-refresh",
      })
    );
  });

  it("throws if no refresh token available", async () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const user = {
      ...mockUser,
      strava_token_expires_at: pastDate,
      strava_refresh_token: null,
    };

    await expect(
      getValidStravaToken(user, mockSupabase, "client-123", "secret-abc")
    ).rejects.toThrow("No refresh token available");
  });
});
