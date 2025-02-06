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
  await expect(page).toHaveScreenshot({
    fullPage: true,
    mask: await page.locator('div[class="inventory_item_img"]').all(),
    maskColor: "black",
    animations: "disabled",
  });
});

test("Verify the price order (high-low) displayed on the “All Items” page.", async ({
  page,
}) => {
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
});

test("Add multiple items to the cart and validate the checkout journey", async ({
  page,
}) => {
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
  });

  await test.step("Provide user information and complete the checkout", async () => {
    await page.locator('[data-test="checkout"]').click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/checkout-step-one\.html/);
    await expect(page).toHaveScreenshot({
      fullPage: true,
      animations: "disabled",
    });

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
  });
});
