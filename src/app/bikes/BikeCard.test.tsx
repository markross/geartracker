import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BikeCard from "./BikeCard";
import type { Bike } from "@/lib/types";

const bike: Bike = {
  id: "bike-1",
  user_id: "user-1",
  name: "Road Bike",
  strava_gear_id: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

describe("BikeCard", () => {
  it("renders bike name and active status", () => {
    render(<BikeCard bike={bike} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Road Bike")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders inactive status", () => {
    render(
      <BikeCard bike={{ ...bike, is_active: false }} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("calls onEdit when Edit clicked", () => {
    const onEdit = vi.fn();
    render(<BikeCard bike={bike} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(bike);
  });

  it("calls onDelete when Delete clicked", () => {
    const onDelete = vi.fn();
    render(<BikeCard bike={bike} onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("bike-1");
  });
});
