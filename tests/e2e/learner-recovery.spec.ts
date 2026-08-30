import { expect, test } from "@playwright/test";

test("recovers when the browser points to a missing learner", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "spanish-coach:learner-id:v1",
      "00000000-0000-4000-8000-000000000000",
    );
  });

  await page.goto("/");

  await expect(page.getByRole("status")).toContainText(
    "The saved profile could not be found.",
  );
  await expect(page.getByRole("heading", { name: "Let the coach plan for you." })).toBeVisible();
  await expect(page.getByLabel("What should the coach call you?")).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem("spanish-coach:learner-id:v1"))).toBeNull();
});
