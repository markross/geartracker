export interface StravaGear {
  id: string;
  name: string;
  brand_name: string;
  model_name: string;
  distance: number; // meters
}

const STRAVA_API = "https://www.strava.com/api/v3";

export async function fetchStravaGear(
  accessToken: string,
  gearId: string
): Promise<StravaGear> {
  const res = await fetch(`${STRAVA_API}/gear/${gearId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Strava API error: ${res.status}`);
  }

  return res.json();
}

export function stravaGearDisplayName(gear: StravaGear): string {
  const parts = [gear.brand_name, gear.model_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : gear.name;
}
