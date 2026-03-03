import { test, expect } from "@playwright/test";

test.describe("Strava Sync", () => {
  test.skip(true, "Requires running app with authenticated Strava session");

  test("sync button triggers import", async ({ page }) => {
    await page.goto("/bikes");

    await page.click("text=Sync with Strava");
    await expect(page.locator("text=Syncing...")).toBeVisible();

    // Wait for sync to complete
    await expect(page.locator("text=Synced:")).toBeVisible({ timeout: 30000 });
  });
});
