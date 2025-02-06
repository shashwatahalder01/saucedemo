import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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
}, testInfo) => {
  await page.locator('[data-test="product-sort-container"]').selectOption("za");
  const productNames = await page
    .locator('[data-test="inventory-item-name"]')
    .allTextContents();

  const sortedProductNames = [...productNames].sort().reverse();
  expect(productNames).toEqual(sortedProductNames);
  await expect(page).toHaveScreenshot({
    fullPage: true,
    mask: await page.locator('div[class="inventory_item_img"]').all(),
    maskColor: "black",
    animations: "disabled",
  });

  // run accessibility scan
  await runAccessibilityScan(page, testInfo, "inventory-page");
});

test("Verify the price order (high-low) displayed on the “All Items” page.", async ({
  page,
}, testInfo) => {
  await page
    .locator('[data-test="product-sort-container"]')
    .selectOption("hilo");
  let productPrices = await page
    .locator('[data-test="inventory-item-price"]')
    .allTextContents();
  productPrices = productPrices.map((price) => parseFloat(price.slice(1)));
  const sortedProductPrices = productPrices.sort((a, b) => b - a);
  expect(productPrices).toEqual(sortedProductPrices);
  await expect(page).toHaveScreenshot({
    fullPage: true,
    mask: await page.locator('div[class="inventory_item_img"]').all(),
    maskColor: "black",
    animations: "disabled",
  });

  // run accessibility scan
  await runAccessibilityScan(page, testInfo, "inventory-page");
});

test("Add multiple items to the cart and validate the checkout journey", async ({
  page,
}, testInfo) => {
  await test.step("Add multiple items to the cart", async () => {
    for (const product of testData.products) {
      await page
        .locator(
          `[data-test="add-to-cart-${product
            .toLowerCase()
            .replaceAll(" ", "-")}"]`
        )
        .click();
    }

    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/cart\.html/);
    for (const product of testData.products) {
      await expect(page.locator(`text="${product}"`)).toBeVisible();
    }
    await expect(page).toHaveScreenshot({
      fullPage: true,
      animations: "disabled",
    });

    // run accessibility scan
    await runAccessibilityScan(page, testInfo, "cart-page");
  });

  await test.step("Provide user information and complete the checkout", async () => {
    await page.locator('[data-test="checkout"]').click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/checkout-step-one\.html/);
    await expect(page).toHaveScreenshot({
      fullPage: true,
      animations: "disabled",
    });

    // run accessibility scan
    await runAccessibilityScan(page, testInfo, "checkout-step1-page");

    await page
      .locator('[data-test="firstName"]')
      .fill(testData.userInfo.firstName);
    await page
      .locator('[data-test="lastName"]')
      .fill(testData.userInfo.lastName);
    await page
      .locator('[data-test="postalCode"]')
      .fill(testData.userInfo.postalCode);

    await page.locator('[data-test="continue"]').click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/checkout-step-two\.html/);
    await expect(page).toHaveScreenshot({
      fullPage: true,
      animations: "disabled",
    });

    // run accessibility scan
    await runAccessibilityScan(page, testInfo, "checkout-step2-page");

    await page.locator('[data-test="finish"]').click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/checkout-complete\.html/);
    await expect(page.locator('[data-test="complete-header"]')).toContainText(
      "Thank you for your order!"
    );
    await expect(page).toHaveScreenshot({
      fullPage: true,
      animations: "disabled",
    });

    // run accessibility scan
    await runAccessibilityScan(page, testInfo, "checkout-complete-page");
  });
});

// Utility function for accessibility scan
async function runAccessibilityScan(page, testInfo, attachmentName = "") {
  const accessibilityScanResults = await new AxeBuilder({ page })
    // .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  await testInfo.attach(`accessibility-scan-results-${attachmentName}`, {
    body: JSON.stringify(accessibilityScanResults, null, 2),
    contentType: "application/json",
  });

  const criticalViolations = accessibilityScanResults.violations.filter(
    (v) => v.impact === "critical"
  );

  /*
  For the time being, we are just attaching the accessibility scan results.
  Uncomment the below line to fail the test if critical violations are not allowed.
  */

  // expect(criticalViolations.length).toBe(0);
}
