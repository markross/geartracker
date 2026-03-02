import { test, expect } from "@playwright/test";

// E2E test for bike CRUD — requires running app + authenticated session
// Skip by default; run with: npx playwright test e2e/bikes.spec.ts
test.describe("Bike Management", () => {
  test.skip(true, "Requires running app with authenticated session");

  test("full CRUD flow", async ({ page }) => {
    await page.goto("/bikes");

    // Create
    await page.click("text=Add Bike");
    await page.fill('[id="bike-name"]', "Test Road Bike");
    await page.click("text=Create");
    await expect(page.locator("text=Test Road Bike")).toBeVisible();

    // Edit
    await page.click("text=Edit");
    await page.fill('[id="bike-name"]', "Updated Road Bike");
    await page.click("text=Update");
    await expect(page.locator("text=Updated Road Bike")).toBeVisible();

    // Delete
    await page.click("text=Delete");
    await expect(page.locator("text=Updated Road Bike")).not.toBeVisible();
  });
});
