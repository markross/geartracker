import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/rides", () => ({
  getRides: vi.fn(),
  getUnassignedRides: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getRides, getUnassignedRides } from "@/lib/rides";

const mockUser = { id: "user-1" };

function mockRequest(query = "") {
  return {
    nextUrl: new URL(`http://localhost/api/rides${query}`),
  } as any;
}

function mockAuthedSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/rides", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as any);

    const res = await GET(mockRequest());
    expect(res.status).toBe(401);
  });

  it("returns all rides by default", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockAuthedSupabase());
    vi.mocked(getRides).mockResolvedValue({
      data: [{ id: "ride-1" }, { id: "ride-2" }],
      error: null,
    } as any);

    const res = await GET(mockRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.rides).toHaveLength(2);
    expect(getRides).toHaveBeenCalledWith(expect.anything(), "user-1");
  });

  it("returns unassigned rides when ?unassigned=true", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockAuthedSupabase());
    vi.mocked(getUnassignedRides).mockResolvedValue({
      data: [{ id: "ride-3", bike_id: null }],
      error: null,
    } as any);

    const res = await GET(mockRequest("?unassigned=true"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.rides).toHaveLength(1);
    expect(getUnassignedRides).toHaveBeenCalledWith(expect.anything(), "user-1");
  });

  it("returns 500 on database error", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockAuthedSupabase());
    vi.mocked(getRides).mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    } as any);

    const res = await GET(mockRequest());
    expect(res.status).toBe(500);
  });
});
