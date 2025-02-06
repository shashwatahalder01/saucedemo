import { test, expect } from "@playwright/test";
import { testData } from "../test-data/test-data";

test.beforeEach(async ({ page }) => {
  // login user
  await page.goto("/");
  await page.locator('[data-test="username"]').fill(testData.user.username);
  await page.locator('[data-test="password"]').fill(testData.user.password);
  await page.locator('[data-test="login-button"]').click();
  await page.waitForLoadState("domcontentloaded");
  await expect(page).toHaveURL(/inventory\.html/);
});

test("Verify the sorting order displayed for Z-A on the “All Items” page", async ({
  page,
}) => {
  await page.locator('[data-test="product-sort-container"]').selectOption("za");
  const productNames = await page
    .locator('[data-test="inventory-item-name"]')
    .allTextContents();

  const sortedProductNames = [...productNames].sort().reverse();
  expect(productNames).toEqual(sortedProductNames);
});
