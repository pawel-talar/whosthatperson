import { expect, test } from "@playwright/test";

test("singleplayer game starts", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("mode-solo").click();
  await page.getByTestId("singleplayer-start").click();
  await expect(page.getByText(/pytanie 1\/5/i)).toBeVisible();
});
