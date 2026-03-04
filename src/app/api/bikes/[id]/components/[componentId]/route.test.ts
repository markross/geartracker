import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT, DELETE, PATCH } from "./route";

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
  verifyBikeOwnership: vi.fn(),
}));

vi.mock("@/lib/components", () => ({
  updateComponent: vi.fn(),
  deleteComponent: vi.fn(),
  retireComponent: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireUser, verifyBikeOwnership } from "@/lib/auth";
import { updateComponent, deleteComponent, retireComponent } from "@/lib/components";

const mockUser = { id: "user-1" };
const mockComponent = {
  id: "comp-1",
  bike_id: "bike-1",
  name: "KMC X11",
  type: "chain",
  max_distance_km: 5000,
  installed_at: "2026-01-01T00:00:00Z",
  retired_at: null,
  created_at: "2026-01-01T00:00:00Z",
};

const params = { id: "bike-1", componentId: "comp-1" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createSupabaseServerClient).mockResolvedValue({} as any);
  vi.mocked(requireUser).mockResolvedValue(mockUser as any);
  vi.mocked(verifyBikeOwnership).mockResolvedValue(true);
});

describe("PUT /api/bikes/[id]/components/[componentId]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PUT",
      body: JSON.stringify({ name: "KMC X12" }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 when no fields to update", async () => {
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PUT",
      body: JSON.stringify({}),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is whitespace-only", async () => {
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PUT",
      body: JSON.stringify({ name: "   " }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Name cannot be empty");
  });

  it("returns 400 for invalid component type", async () => {
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PUT",
      body: JSON.stringify({ type: "invalid" }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 for negative max_distance_km", async () => {
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PUT",
      body: JSON.stringify({ max_distance_km: -100 }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("max_distance_km must be positive");
  });

  it("returns 400 for zero max_distance_km", async () => {
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PUT",
      body: JSON.stringify({ max_distance_km: 0 }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 404 when bike not owned by user", async () => {
    vi.mocked(verifyBikeOwnership).mockResolvedValue(false);
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PUT",
      body: JSON.stringify({ name: "KMC X12" }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(404);
  });

  it("updates a component and returns 200", async () => {
    const updated = { ...mockComponent, name: "KMC X12" };
    vi.mocked(updateComponent).mockResolvedValue({ data: updated, error: null } as any);

    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PUT",
      body: JSON.stringify({ name: "KMC X12" }),
    });
    const res = await PUT(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.component).toEqual(updated);
    expect(updateComponent).toHaveBeenCalledWith(expect.anything(), "comp-1", { name: "KMC X12" });
  });

  it("passes installed_at in updates when provided", async () => {
    vi.mocked(updateComponent).mockResolvedValue({ data: mockComponent, error: null } as any);

    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PUT",
      body: JSON.stringify({ installed_at: "2026-02-01" }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(200);
    expect(updateComponent).toHaveBeenCalledWith(expect.anything(), "comp-1", { installed_at: "2026-02-01" });
  });

  it("returns 500 on database error", async () => {
    vi.mocked(updateComponent).mockResolvedValue({ data: null, error: { message: "DB error" } } as any);

    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PUT",
      body: JSON.stringify({ name: "KMC X12" }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/bikes/[id]/components/[componentId]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", { method: "DELETE" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when bike not owned by user", async () => {
    vi.mocked(verifyBikeOwnership).mockResolvedValue(false);
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", { method: "DELETE" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(404);
  });

  it("deletes a component and returns 204", async () => {
    vi.mocked(deleteComponent).mockResolvedValue({ error: null } as any);

    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", { method: "DELETE" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(204);
    expect(deleteComponent).toHaveBeenCalledWith(expect.anything(), "comp-1");
  });

  it("returns 500 on database error", async () => {
    vi.mocked(deleteComponent).mockResolvedValue({ error: { message: "DB error" } } as any);

    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", { method: "DELETE" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/bikes/[id]/components/[componentId]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "retire" }),
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid action", async () => {
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "invalid" }),
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 404 when bike not owned by user", async () => {
    vi.mocked(verifyBikeOwnership).mockResolvedValue(false);
    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "retire" }),
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(404);
  });

  it("retires a component", async () => {
    const retired = { ...mockComponent, retired_at: "2026-03-02T00:00:00Z" };
    vi.mocked(retireComponent).mockResolvedValue({ data: retired, error: null } as any);

    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "retire" }),
    });
    const res = await PATCH(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.component.retired_at).toBeTruthy();
    expect(retireComponent).toHaveBeenCalledWith(expect.anything(), "comp-1", expect.any(String));
  });

  it("retires with custom retired_at date when provided", async () => {
    const retired = { ...mockComponent, retired_at: "2026-06-15" };
    vi.mocked(retireComponent).mockResolvedValue({ data: retired, error: null } as any);

    const req = new Request("http://localhost/api/bikes/bike-1/components/comp-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "retire", retired_at: "2026-06-15" }),
    });
    const res = await PATCH(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.component.retired_at).toBe("2026-06-15");
    expect(retireComponent).toHaveBeenCalledWith(expect.anything(), "comp-1", "2026-06-15");
  });
});
