export type ComponentType =
  | "chain"
  | "cassette"
  | "chainring"
  | "tire_front"
  | "tire_rear"
  | "brake_pads"
  | "cables"
  | "bar_tape"
  | "custom";

export type DistanceUnit = "km" | "mi";

export interface User {
  id: string;
  email: string;
  strava_athlete_id: number | null;
  strava_access_token: string | null;
  strava_refresh_token: string | null;
  strava_token_expires_at: string | null;
  distance_unit: DistanceUnit;
  created_at: string;
}

export interface Bike {
  id: string;
  user_id: string;
  name: string;
  strava_gear_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Component {
  id: string;
  bike_id: string;
  name: string;
  type: ComponentType;
  max_distance_km: number;
  installed_at: string;
  retired_at: string | null;
  created_at: string;
}

export interface Ride {
  id: string;
  user_id: string;
  bike_id: string | null;
  strava_activity_id: number | null;
  name: string;
  distance_km: number;
  moving_time_seconds: number;
  started_at: string;
  created_at: string;
}

export interface BikeInsert {
  user_id: string;
  name: string;
  strava_gear_id?: string | null;
  is_active?: boolean;
}

export interface BikeUpdate {
  name?: string;
  strava_gear_id?: string | null;
  is_active?: boolean;
}

export interface ComponentInsert {
  bike_id: string;
  name: string;
  type: ComponentType;
  max_distance_km: number;
  installed_at?: string;
}

export interface ComponentFormData {
  name: string;
  type: ComponentType;
  max_distance_km: number;
  installed_at: string;
}

export interface ComponentUpdate {
  name?: string;
  type?: ComponentType;
  max_distance_km?: number;
  installed_at?: string;
  retired_at?: string | null;
}

export type WearStatus = "good" | "warning" | "critical" | "overdue";

export interface ComponentWearStats {
  component: Component;
  distance_km: number;
  wear_pct: number;
  status: WearStatus;
}

export interface BikeWearStats {
  bike: Bike;
  components: ComponentWearStats[];
}

export interface RideInsert {
  user_id: string;
  bike_id?: string | null;
  strava_activity_id?: number | null;
  name: string;
  distance_km: number;
  moving_time_seconds?: number;
  started_at: string;
}
