import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ComponentForm from "./ComponentForm";

describe("ComponentForm", () => {
  it("renders empty form for create with today as installed date", () => {
    render(<ComponentForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Type")).toHaveValue("chain");
    expect(screen.getByLabelText("Max Distance (km)")).toHaveValue(null);
    expect(screen.getByLabelText("Installed Date")).toHaveValue(new Date().toISOString().slice(0, 10));
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("renders pre-filled form for edit", () => {
    const component = {
      id: "comp-1",
      bike_id: "bike-1",
      name: "KMC X11",
      type: "chain" as const,
      max_distance_km: 5000,
      installed_at: "2026-01-01T00:00:00Z",
      retired_at: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    render(<ComponentForm component={component} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText("Name")).toHaveValue("KMC X11");
    expect(screen.getByLabelText("Type")).toHaveValue("chain");
    expect(screen.getByLabelText("Max Distance (km)")).toHaveValue(5000);
    expect(screen.getByLabelText("Installed Date")).toHaveValue("2026-01-01");
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("shows error when name is empty", () => {
    const onSubmit = vi.fn();
    render(<ComponentForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Max Distance (km)"), { target: { value: "5000" } });
    fireEvent.click(screen.getByText("Create"));
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows error when max distance is invalid", () => {
    const onSubmit = vi.fn();
    render(<ComponentForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test" } });
    fireEvent.click(screen.getByText("Create"));
    expect(screen.getByText("Max distance must be a positive number")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with valid data", () => {
    const onSubmit = vi.fn();
    render(<ComponentForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "KMC X11" } });
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "cassette" } });
    fireEvent.change(screen.getByLabelText("Max Distance (km)"), { target: { value: "8000" } });
    fireEvent.click(screen.getByText("Create"));
    expect(onSubmit).toHaveBeenCalledWith({ name: "KMC X11", type: "cassette", max_distance_km: 8000, installed_at: expect.any(String) });
  });

  it("calls onCancel when Cancel clicked", () => {
    const onCancel = vi.fn();
    render(<ComponentForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});