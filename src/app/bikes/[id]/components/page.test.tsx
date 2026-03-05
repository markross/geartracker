import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/components", () => ({
  getComponents: vi.fn(),
}));

vi.mock("@/lib/wear", () => ({
  getComponentWear: vi.fn(),
}));

vi.mock("@/lib/rides", () => ({
  getRidesForBike: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

vi.mock("./ComponentList", () => ({
  default: ({ initialComponents }: { initialComponents: any[] }) => (
    <div data-testid="component-list">{initialComponents.length} components</div>
  ),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getComponents } from "@/lib/components";
import { getComponentWear } from "@/lib/wear";
import { redirect } from "next/navigation";
import { render, screen } from "@testing-library/react";
import ComponentsPage from "./page";

describe("ComponentsPage", () => {
  it("redirects when not authenticated", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Not authenticated" },
        }),
      },
    } as any);

    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(ComponentsPage({ params: { id: "bike-1" } })).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders ComponentList when authenticated", async () => {
    const fromChain: Record<string, any> = {};
    fromChain.select = vi.fn().mockReturnValue(fromChain);
    fromChain.eq = vi.fn().mockReturnValue(fromChain);
    fromChain.single = vi.fn().mockResolvedValue({ data: { distance_unit: "km" }, error: null });

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(fromChain),
    } as any);

    const mockComp = { id: "comp-1", bike_id: "bike-1", name: "KMC X11", type: "chain", max_distance_km: 5000, installed_at: "2026-01-01", retired_at: null, created_at: "2026-01-01" };
    vi.mocked(getComponents).mockResolvedValue({
      data: [mockComp],
      error: null,
    } as any);

    vi.mocked(getComponentWear).mockResolvedValue({
      component: mockComp as any,
      distance_km: 1000,
      wear_pct: 20,
      status: "good",
    });

    const jsx = await ComponentsPage({ params: { id: "bike-1" } });
    render(jsx);

    expect(screen.getByText("Components")).toBeInTheDocument();
    expect(screen.getByTestId("component-list")).toHaveTextContent("1 components");
    expect(screen.getByText("Back to Bikes")).toBeInTheDocument();
  });
});