import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BikeForm from "./BikeForm";

describe("BikeForm", () => {
  it("renders empty form for create", () => {
    render(<BikeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText("Bike Name")).toHaveValue("");
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("renders pre-filled form for edit", () => {
    const bike = {
      id: "bike-1",
      user_id: "user-1",
      name: "Road Bike",
      strava_gear_id: null,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
    };
    render(<BikeForm bike={bike} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText("Bike Name")).toHaveValue("Road Bike");
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("shows error when submitting empty name", () => {
    const onSubmit = vi.fn();
    render(<BikeForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText("Create"));
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with trimmed name", () => {
    const onSubmit = vi.fn();
    render(<BikeForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Bike Name"), {
      target: { value: "  Gravel Bike  " },
    });
    fireEvent.click(screen.getByText("Create"));
    expect(onSubmit).toHaveBeenCalledWith({ name: "Gravel Bike" });
  });

  it("calls onCancel when Cancel clicked", () => {
    const onCancel = vi.fn();
    render(<BikeForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});
