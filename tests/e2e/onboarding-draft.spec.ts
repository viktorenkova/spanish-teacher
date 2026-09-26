import { expect, test } from "@playwright/test";

test("restores an interrupted diagnostic locally and clears it on reset", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("What should the coach call you?").fill("Draft learner");
  await page.getByText("Personalise your plan (optional)").click();
  await page.getByLabel("Your main goal").selectOption("travel");
  await page.getByRole("button", { name: "Continue to a short check" }).click();
  await page.getByText("Buenos días", { exact: true }).click();
  await page.getByText("llamo", { exact: true }).click();
  await page.reload();

  await expect(page.getByRole("heading", { name: "Show what is already familiar." })).toBeVisible();
  await expect(page.getByLabel("Buenos días")).toBeChecked();
  await expect(page.getByLabel("llamo")).toBeChecked();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("What should the coach call you?")).toHaveValue("Draft learner");
  await page.getByText("Personalise your plan (optional)").click();
  await expect(page.getByLabel("Your main goal")).toHaveValue("travel");
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByLabel("What should the coach call you?")).toHaveValue("");
  await expect(page.getByLabel("Your main goal")).toHaveValue("conversation");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Let the coach plan for you." })).toBeVisible();
});
