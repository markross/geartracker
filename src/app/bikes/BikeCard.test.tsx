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

const defaultProps = {
  bike,
  totalDistanceKm: 1500,
  distanceUnit: "km" as const,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("BikeCard", () => {
  it("renders bike name and active status", () => {
    render(<BikeCard {...defaultProps} />);
    expect(screen.getByText("Road Bike")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders total distance", () => {
    render(<BikeCard {...defaultProps} totalDistanceKm={1500} distanceUnit="km" />);
    expect(screen.getByText("1,500 km total")).toBeInTheDocument();
  });

  it("renders distance in miles", () => {
    render(<BikeCard {...defaultProps} totalDistanceKm={1609.34} distanceUnit="mi" />);
    expect(screen.getByText("1,000 mi total")).toBeInTheDocument();
  });

  it("renders inactive status", () => {
    render(<BikeCard {...defaultProps} bike={{ ...bike, is_active: false }} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("calls onEdit when Edit clicked", () => {
    const onEdit = vi.fn();
    render(<BikeCard {...defaultProps} onEdit={onEdit} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(bike);
  });

  it("calls onDelete when Delete clicked", () => {
    const onDelete = vi.fn();
    render(<BikeCard {...defaultProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("bike-1");
  });
});
