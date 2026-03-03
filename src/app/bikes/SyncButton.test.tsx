import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SyncButton from "./SyncButton";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("SyncButton", () => {
  it("renders sync button", () => {
    render(<SyncButton />);
    expect(screen.getByText("Sync with Strava")).toBeInTheDocument();
  });

  it("shows syncing state", async () => {
    let resolveFetch: (value: any) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      )
    );

    render(<SyncButton />);
    fireEvent.click(screen.getByText("Sync with Strava"));

    expect(screen.getByText("Syncing...")).toBeInTheDocument();
    expect(screen.getByText("Syncing...")).toBeDisabled();

    resolveFetch!({
      ok: true,
      json: () => Promise.resolve({ fetched: 0, imported: 0, skipped: 0 }),
    });

    await waitFor(() => {
      expect(screen.getByText("Sync with Strava")).toBeInTheDocument();
    });
  });

  it("shows success result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ fetched: 5, imported: 3, skipped: 2 }),
      })
    );

    render(<SyncButton />);
    fireEvent.click(screen.getByText("Sync with Strava"));

    await waitFor(() => {
      expect(screen.getByText("Synced: 3 new rides (2 already imported)")).toBeInTheDocument();
    });
  });

  it("shows error on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Strava not connected" }),
      })
    );

    render(<SyncButton />);
    fireEvent.click(screen.getByText("Sync with Strava"));

    await waitFor(() => {
      expect(screen.getByText("Strava not connected")).toBeInTheDocument();
    });
  });
});
