import { expect, test } from "@playwright/test";
import { cleanupLearner, completeOnboarding } from "./helpers";

test("resumes the active lesson at the first incomplete exercise", async ({ page }) => {
  const displayName = `E2E Resume ${Date.now()}`;
  let learnerId: string | undefined;

  try {
    learnerId = await completeOnboarding(page, displayName);
    await page.getByRole("button", { name: "Build my lesson" }).click();
    await expect(page.getByRole("heading", { name: "A coherent path, chosen for you." })).toBeVisible();
    await page.getByRole("button", { name: "Start the ready practice" }).click();

    await expect(page.getByRole("heading", { name: /What does Lucía mean/ })).toBeVisible();
    await page.getByRole("radio", { name: "Pleased to meet you" }).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: /Choose the natural answer/ })).toBeVisible();

    await page.reload();

    await expect(page.getByRole("heading", { name: /Choose the natural answer/ })).toBeVisible();
    await expect(page.getByText("20%", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "End this lesson" }).click();
    await expect(page.getByRole("group", { name: "End this lesson?" })).toBeVisible();
    await page.getByRole("button", { name: "Keep learning" }).click();
    await expect(page.getByRole("group", { name: "End this lesson?" })).toBeHidden();

    await page.getByRole("button", { name: "End this lesson" }).click();
    await page.getByRole("button", { name: "End lesson now" }).click();
    await expect(page.getByRole("heading", { name: "How much time do you have?" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "How much time do you have?" })).toBeVisible();
  } finally {
    await cleanupLearner(displayName, learnerId);
  }
});
