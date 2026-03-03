import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/sync", () => ({
  syncStravaActivities: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { syncStravaActivities } from "@/lib/sync";

const mockUser = { id: "user-1" };
const mockProfile = {
  id: "user-1",
  email: "test@example.com",
  strava_athlete_id: 12345,
  strava_access_token: "token-123",
  strava_refresh_token: "refresh-456",
  strava_token_expires_at: "2026-12-01T00:00:00Z",
  distance_unit: "km",
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRAVA_CLIENT_ID = "cid";
  process.env.STRAVA_CLIENT_SECRET = "csec";
});

function mockAuth(user: typeof mockUser | null, profile = mockProfile) {
  const mockSingle = vi.fn().mockResolvedValue({ data: profile, error: null });
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: "Not authenticated" },
      }),
    },
    from: vi.fn().mockReturnValue({ select: mockSelect }),
  };
  vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as any);
  return supabase;
}

describe("POST /api/sync", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("returns 400 when Strava not connected", async () => {
    mockAuth(mockUser, { ...mockProfile, strava_access_token: null } as any);
    const res = await POST();
    expect(res.status).toBe(400);
  });

  it("syncs and returns result", async () => {
    mockAuth(mockUser);
    vi.mocked(syncStravaActivities).mockResolvedValue({
      fetched: 5,
      imported: 3,
      skipped: 2,
      errors: 0,
      bikes_created: 0,
    });

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ fetched: 5, imported: 3, skipped: 2, errors: 0, bikes_created: 0 });
  });

  it("returns 500 on sync error", async () => {
    mockAuth(mockUser);
    vi.mocked(syncStravaActivities).mockRejectedValue(new Error("Strava API error: 401"));

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Strava API error: 401");
  });
});
