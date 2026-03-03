import { describe, it, expect } from "vitest";
import {
  formatDistance,
  kmToMiles,
  milesToKm,
  distanceLabel,
} from "./distance";

describe("kmToMiles", () => {
  it("converts 0 km to 0 mi", () => {
    expect(kmToMiles(0)).toBe(0);
  });

  it("converts 1.60934 km to 1 mi", () => {
    expect(kmToMiles(1.60934)).toBeCloseTo(1, 5);
  });

  it("converts 100 km to ~62.14 mi", () => {
    expect(kmToMiles(100)).toBeCloseTo(62.1371, 2);
  });
});

describe("milesToKm", () => {
  it("converts 0 mi to 0 km", () => {
    expect(milesToKm(0)).toBe(0);
  });

  it("converts 1 mi to 1.60934 km", () => {
    expect(milesToKm(1)).toBeCloseTo(1.60934, 4);
  });

  it("converts 100 mi to 160.934 km", () => {
    expect(milesToKm(100)).toBeCloseTo(160.934, 1);
  });
});

describe("distanceLabel", () => {
  it('returns "km" for km unit', () => {
    expect(distanceLabel("km")).toBe("km");
  });

  it('returns "mi" for mi unit', () => {
    expect(distanceLabel("mi")).toBe("mi");
  });
});

describe("formatDistance", () => {
  it("formats km value with km unit (no conversion)", () => {
    expect(formatDistance(1234.5, "km")).toBe("1,235 km");
  });

  it("converts and formats km value with mi unit", () => {
    expect(formatDistance(100, "mi")).toBe("62 mi");
  });

  it("formats 0 correctly", () => {
    expect(formatDistance(0, "km")).toBe("0 km");
    expect(formatDistance(0, "mi")).toBe("0 mi");
  });

  it("rounds to nearest integer", () => {
    expect(formatDistance(1234.9, "km")).toBe("1,235 km");
    expect(formatDistance(1234.1, "km")).toBe("1,234 km");
  });
});
