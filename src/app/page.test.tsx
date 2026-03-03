import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Home from "./page";

describe("Home page", () => {
  it("renders landing page when not authenticated", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    const jsx = await Home();
    render(jsx);
    expect(screen.getByText("GearTracker")).toBeInTheDocument();
    expect(
      screen.getByText(/track wear on your bike components/i)
    ).toBeInTheDocument();
  });

  it("redirects authenticated users to dashboard", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    } as any);

    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(Home()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
