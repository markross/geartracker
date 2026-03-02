import { test, expect } from "@playwright/test";

test.describe("Component Management", () => {
  test.skip(true, "Requires running app with authenticated session");

  test("full CRUD flow", async ({ page }) => {
    // Assumes a bike already exists
    await page.goto("/bikes");
    await page.click("text=Road Bike");

    // Create
    await page.click("text=Add Component");
    await page.fill('[id="component-name"]', "KMC X11");
    await page.selectOption('[id="component-type"]', "chain");
    await page.fill('[id="max-distance"]', "5000");
    await page.click("text=Create");
    await expect(page.locator("text=KMC X11")).toBeVisible();

    // Edit
    await page.click("text=Edit");
    await page.fill('[id="component-name"]', "KMC X12");
    await page.click("text=Update");
    await expect(page.locator("text=KMC X12")).toBeVisible();

    // Retire
    await page.click("text=Retire");
    await expect(page.locator("text=Retired")).toBeVisible();

    // Delete
    await page.click("text=Delete");
    await expect(page.locator("text=KMC X12")).not.toBeVisible();
  });
});
