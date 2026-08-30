import { expect, test } from "@playwright/test";
import { cleanupLearner, completeOnboarding } from "./helpers";

test("switches between learner profiles saved in the same browser", async ({ page }) => {
  const firstName = `E2E First ${Date.now()}`;
  const secondName = `E2E Second ${Date.now()}`;
  let firstLearnerId: string | undefined;
  let secondLearnerId: string | undefined;

  try {
    firstLearnerId = await completeOnboarding(page, firstName);
    await expect(page.getByText(`Saved progress · ${firstName}`, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Change learner" }).click();

    await expect(page.getByRole("heading", { name: "Who is learning today?" })).toBeVisible();
    await expect(page.getByRole("button", { name: new RegExp(firstName) })).toBeVisible();
    await page.getByRole("button", { name: "Create a new learner profile" }).click();

    secondLearnerId = await completeOnboarding(page, secondName, { navigate: false });
    await expect(page.getByText(`Saved progress · ${secondName}`, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Build my lesson" }).click();
    await expect(page.getByRole("heading", { name: "A coherent path, chosen for you." })).toBeVisible();
    await page.getByRole("button", { name: "Change learner" }).click();

    await page.getByRole("button", { name: new RegExp(firstName) }).click();
    await expect(page.getByText(`Saved progress · ${firstName}`, { exact: true })).toBeVisible();
  } finally {
    await cleanupLearner(firstName, firstLearnerId);
    await cleanupLearner(secondName, secondLearnerId);
  }
});
