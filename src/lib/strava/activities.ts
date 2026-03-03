export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  start_date: string; // ISO
  gear_id: string | null;
  type: string;
}

const STRAVA_API = "https://www.strava.com/api/v3";

export async function fetchStravaActivities(
  accessToken: string,
  after?: number, // epoch seconds
  page = 1,
  perPage = 50
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (after) {
    params.set("after", String(after));
  }

  const res = await fetch(`${STRAVA_API}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Strava API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchAllStravaActivities(
  accessToken: string,
  after?: number
): Promise<StravaActivity[]> {
  const all: StravaActivity[] = [];
  let page = 1;

  while (true) {
    const batch = await fetchStravaActivities(accessToken, after, page, 100);
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return all;
}
