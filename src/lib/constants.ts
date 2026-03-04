import type { ComponentType } from "./types";

export const VALID_COMPONENT_TYPES: ComponentType[] = [
  "chain", "cassette", "chainring", "tire_front", "tire_rear",
  "brake_pads", "cables", "bar_tape", "custom",
];

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  chain: "Chain",
  cassette: "Cassette",
  chainring: "Chainring",
  tire_front: "Front Tire",
  tire_rear: "Rear Tire",
  brake_pads: "Brake Pads",
  cables: "Cables",
  bar_tape: "Bar Tape",
  custom: "Custom",
};
