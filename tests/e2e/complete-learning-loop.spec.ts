import { expect, test, type Page } from "@playwright/test";
import { cleanupLearner, completeOnboarding, installMediaMocks } from "./helpers";

async function answerChoice(page: Page, answer: string, nextPrompt: RegExp) {
  await page.getByRole("radio", { name: answer }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("heading", { name: nextPrompt })).toBeVisible();
}

test("completes a lesson with listening and speaking, then adapts the next topic", async ({ page }) => {
  const displayName = `E2E Full Loop ${Date.now()}`;
  let learnerId: string | undefined;

  try {
    await installMediaMocks(page, "Me llamo Katia. Soy de Madrid.");
    learnerId = await completeOnboarding(page, displayName);
    await page.getByRole("button", { name: "Build my lesson" }).click();
    await page.getByRole("button", { name: "Start the ready practice" }).click();

    await answerChoice(page, "Pleased to meet you", /Choose the natural answer/);
    await answerChoice(page, "Me llamo Kate.", /Where is Lucía from/);

    await page.getByRole("button", { name: /Play Spanish audio/ }).click();
    await expect(page.getByText(/Played with local Piper audio/)).toBeVisible();
    await answerChoice(page, "Madrid", /Which answer matches/);
    await answerChoice(page, "Soy de Inglaterra.", /Introduce yourself aloud/);

    await page.getByRole("button", { name: /Start microphone/ }).click();
    await expect(page.getByText("Me llamo Katia. Soy de Madrid.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Check spoken answer" }).click();

    await expect(page.getByRole("heading", { name: "You can make a first introduction." })).toBeVisible();
    await expect(page.getByText(/speaking task completed/)).toBeVisible();
    await page.getByRole("button", { name: "Plan the next lesson" }).click();
    await page.getByRole("button", { name: "Build my lesson" }).click();

    await expect(page.getByRole("heading", { name: "A coherent path, chosen for you." })).toBeVisible();
    await expect(page.getByText("Talk about your morning", { exact: true })).toBeVisible();
  } finally {
    await cleanupLearner(displayName, learnerId);
  }
});
