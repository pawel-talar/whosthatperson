import { expect, test } from "@playwright/test";

test("multiplayer lobby creation", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("mode-multiplayer").click();
  await page.getByTestId("multiplayer-name").fill("Tester");
  await page.getByTestId("multiplayer-create").click();
  await expect(page).toHaveURL(/\/room\/.+/);
});
