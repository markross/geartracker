import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ComponentCard from "./ComponentCard";
import type { Component } from "@/lib/types";

const component: Component = {
  id: "comp-1",
  bike_id: "bike-1",
  name: "KMC X11",
  type: "chain",
  max_distance_km: 5000,
  installed_at: "2026-01-01T00:00:00Z",
  retired_at: null,
  created_at: "2026-01-01T00:00:00Z",
};

describe("ComponentCard", () => {
  it("renders component name, type, and distance limit", () => {
    render(<ComponentCard component={component} onEdit={vi.fn()} onDelete={vi.fn()} onRetire={vi.fn()} />);
    expect(screen.getByText("KMC X11")).toBeInTheDocument();
    expect(screen.getByText(/Chain/)).toBeInTheDocument();
    expect(screen.getByText(/5,000 km limit/)).toBeInTheDocument();
  });

  it("shows Retired label when retired", () => {
    render(
      <ComponentCard
        component={{ ...component, retired_at: "2026-03-01T00:00:00Z" }}
        onEdit={vi.fn()} onDelete={vi.fn()} onRetire={vi.fn()}
      />
    );
    expect(screen.getByText("Retired")).toBeInTheDocument();
    expect(screen.queryByText("Retire")).not.toBeInTheDocument();
  });

  it("calls onEdit when Edit clicked", () => {
    const onEdit = vi.fn();
    render(<ComponentCard component={component} onEdit={onEdit} onDelete={vi.fn()} onRetire={vi.fn()} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(component);
  });

  it("calls onDelete when Delete clicked", () => {
    const onDelete = vi.fn();
    render(<ComponentCard component={component} onEdit={vi.fn()} onDelete={onDelete} onRetire={vi.fn()} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("comp-1");
  });

  it("calls onRetire when Retire clicked", () => {
    const onRetire = vi.fn();
    render(<ComponentCard component={component} onEdit={vi.fn()} onDelete={vi.fn()} onRetire={onRetire} />);
    fireEvent.click(screen.getByText("Retire"));
    expect(onRetire).toHaveBeenCalledWith("comp-1");
  });
});