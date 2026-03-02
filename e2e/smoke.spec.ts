import { test, expect } from "@playwright/test";

test("homepage loads and shows app name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("GearTracker")).toBeVisible();
});
