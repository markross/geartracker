import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/bikes", () => ({
  getBikes: vi.fn(),
}));

vi.mock("@/lib/components", () => ({
  getComponents: vi.fn(),
}));

vi.mock("@/lib/wear", () => ({
  getBikeWearStats: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBikes } from "@/lib/bikes";
import { getComponents } from "@/lib/components";
import { getBikeWearStats } from "@/lib/wear";

const mockUser = { id: "user-1", email: "test@example.com" };
const mockBike = {
  id: "bike-1",
  user_id: "user-1",
  name: "Road Bike",
  strava_gear_id: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};
const mockComponent = {
  id: "comp-1",
  bike_id: "bike-1",
  name: "Chain",
  type: "chain",
  max_distance_km: 5000,
  installed_at: "2026-01-01T00:00:00Z",
  retired_at: null,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

function mockAuth(user: typeof mockUser | null) {
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: "Not authenticated" },
      }),
    },
  };
  vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as any);
  return supabase;
}

describe("GET /api/dashboard", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const req = new Request("http://localhost/api/dashboard");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns dashboard data for authenticated user", async () => {
    const supabase = mockAuth(mockUser);
    vi.mocked(getBikes).mockResolvedValue({ data: [mockBike], error: null } as any);
    vi.mocked(getComponents).mockResolvedValue({ data: [mockComponent], error: null } as any);
    vi.mocked(getBikeWearStats).mockResolvedValue({
      bike: mockBike,
      components: [
        {
          component: mockComponent,
          distance_km: 2500,
          wear_pct: 50,
          status: "good",
        },
      ],
    });

    const req = new Request("http://localhost/api/dashboard");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bikes).toHaveLength(1);
    expect(body.bikes[0].bike.name).toBe("Road Bike");
    expect(body.bikes[0].components[0].wear_pct).toBe(50);
  });

  it("returns empty array when no bikes", async () => {
    mockAuth(mockUser);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);

    const req = new Request("http://localhost/api/dashboard");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bikes).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    mockAuth(mockUser);
    vi.mocked(getBikes).mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    } as any);

    const req = new Request("http://localhost/api/dashboard");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
