import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Who's that person?" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /zgadnij postać/i })
  ).toBeVisible();
});
