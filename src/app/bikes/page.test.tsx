import { describe, it, expect, vi } from "vitest";

// Mock next/navigation before importing component
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/bikes", () => ({
  getBikes: vi.fn(),
}));

// Mock BikeList as a simple div to avoid client component issues in tests
vi.mock("./BikeList", () => ({
  default: ({ initialBikes }: { initialBikes: any[] }) => (
    <div data-testid="bike-list">{initialBikes.length} bikes</div>
  ),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBikes } from "@/lib/bikes";
import { redirect } from "next/navigation";
import { render, screen } from "@testing-library/react";
import BikesPage from "./page";

describe("BikesPage", () => {
  it("redirects to / when not authenticated", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Not authenticated" },
        }),
      },
    } as any);

    // redirect throws in Next.js, simulate that
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(BikesPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders BikeList with bikes when authenticated", async () => {
    const mockBike = {
      id: "bike-1",
      user_id: "user-1",
      name: "Road Bike",
      strava_gear_id: null,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    } as any);

    vi.mocked(getBikes).mockResolvedValue({
      data: [mockBike],
      error: null,
    } as any);

    const jsx = await BikesPage();
    render(jsx);

    expect(screen.getByText("My Bikes")).toBeInTheDocument();
    expect(screen.getByTestId("bike-list")).toHaveTextContent("1 bikes");
  });
});
