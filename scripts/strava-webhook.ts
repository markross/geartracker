/**
 * Strava webhook subscription management.
 * Usage: npx tsx scripts/strava-webhook.ts create|view|delete
 *
 * Required env vars (from .env.local):
 *   STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET,
 *   STRAVA_WEBHOOK_VERIFY_TOKEN, STRAVA_WEBHOOK_CALLBACK_URL
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const STRAVA_API = "https://www.strava.com/api/v3";

const clientId = process.env.STRAVA_CLIENT_ID!;
const clientSecret = process.env.STRAVA_CLIENT_SECRET!;
const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN!;
const callbackUrl = process.env.STRAVA_WEBHOOK_CALLBACK_URL!;

async function createSubscription() {
  if (!callbackUrl || !verifyToken) {
    console.error("Missing STRAVA_WEBHOOK_CALLBACK_URL or STRAVA_WEBHOOK_VERIFY_TOKEN");
    process.exit(1);
  }

  const res = await fetch(`${STRAVA_API}/push_subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      callback_url: callbackUrl,
      verify_token: verifyToken,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Failed to create subscription:", data);
    process.exit(1);
  }
  console.log("Subscription created:", data);
}

async function viewSubscription() {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${STRAVA_API}/push_subscriptions?${params}`);
  const data = await res.json();

  if (!res.ok) {
    console.error("Failed to view subscriptions:", data);
    process.exit(1);
  }

  if (Array.isArray(data) && data.length === 0) {
    console.log("No active subscriptions.");
  } else {
    console.log("Active subscriptions:", JSON.stringify(data, null, 2));
  }
}

async function deleteSubscription() {
  // First, get existing subscription
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
  });

  const listRes = await fetch(`${STRAVA_API}/push_subscriptions?${params}`);
  const subs = await listRes.json();

  if (!Array.isArray(subs) || subs.length === 0) {
    console.log("No subscriptions to delete.");
    return;
  }

  for (const sub of subs) {
    const res = await fetch(`${STRAVA_API}/push_subscriptions/${sub.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (res.ok || res.status === 204) {
      console.log(`Deleted subscription ${sub.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      console.error(`Failed to delete subscription ${sub.id}:`, data);
    }
  }
}

const command = process.argv[2];

if (!clientId || !clientSecret) {
  console.error("Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET in .env.local");
  process.exit(1);
}

switch (command) {
  case "create":
    createSubscription();
    break;
  case "view":
    viewSubscription();
    break;
  case "delete":
    deleteSubscription();
    break;
  default:
    console.log("Usage: npx tsx scripts/strava-webhook.ts create|view|delete");
    process.exit(1);
}
