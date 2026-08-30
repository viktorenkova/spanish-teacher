import { expect, test, type Page } from "@playwright/test";
import {
  cleanupLearner,
  completeOnboarding,
  installMediaMocks,
  loadLatestPilotFeedback,
} from "./helpers";

async function answerChoice(
  page: Page,
  answer: string,
  nextPrompt: RegExp,
  verifyPersistentFeedback = false,
) {
  await page.getByRole("radio", { name: answer }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  if (verifyPersistentFeedback) {
    await page.waitForTimeout(1_300);
    await expect(page.getByRole("status")).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: nextPrompt })).toBeHidden();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: nextPrompt })).toBeVisible();
}

test("completes a lesson with listening and speaking, then adapts the next topic", async ({ page }) => {
  const displayName = `E2E Full Loop ${Date.now()}`;
  let learnerId: string | undefined;

  try {
    await installMediaMocks(page, "Me llamo Katia. Soy de Madrid.");
    learnerId = await completeOnboarding(page, displayName);
    if (!learnerId) throw new Error("Onboarding did not persist a learner ID.");
    await page.getByRole("button", { name: "Build my lesson" }).click();
    await page.getByRole("button", { name: "Start the ready practice" }).click();

    await page.getByRole("radio", { name: "See you tomorrow" }).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    const retryFeedback = page.locator("p.feedback.retry");
    await expect(retryFeedback).toContainText("Not quite");
    await page.waitForTimeout(1_300);
    await expect(retryFeedback).toBeVisible();

    await answerChoice(page, "Pleased to meet you", /Choose the natural answer/, true);
    await answerChoice(page, "Me llamo Kate.", /Where is Lucía from/);

    await page.getByRole("button", { name: /Play Spanish audio/ }).click();
    await expect(page.getByText(/Played with local Piper audio/)).toBeVisible();
    await answerChoice(page, "Madrid", /Which answer matches/);
    await answerChoice(page, "Soy de Inglaterra.", /Introduce yourself aloud/);

    await page.getByRole("button", { name: /Start microphone/ }).click();
    await expect(page.getByText(/Transcription starts only after you stop/)).toBeVisible();
    await page.getByRole("button", { name: /Stop listening/ }).click();
    await expect(page.getByText("Me llamo Katia. Soy de Madrid.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Check spoken answer" }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await page.getByRole("button", { name: "View lesson summary" }).click();

    await expect(page.getByRole("heading", { name: "You can make a first introduction." })).toBeVisible();
    await expect(page.getByText(/speaking task completed/)).toBeVisible();
    await page.getByRole("radio", { name: "5" }).check();
    await page.getByLabel("Lesson pace").selectOption("comfortable");
    await page.getByLabel("Time to read hints and comments").selectOption("enough");
    await page.getByLabel("Microphone transcription").selectOption("complete");
    await page.getByLabel(/What should we improve/).fill("Keep the user-paced controls.");
    await page.getByRole("button", { name: "Send feedback" }).click();
    await expect(page.getByRole("heading", { name: /Thank you/ })).toBeVisible();

    const savedFeedback = await loadLatestPilotFeedback(learnerId);
    expect(savedFeedback).toMatchObject({
      overall_rating: 5,
      pacing: "comfortable",
      reading_time: "enough",
      microphone_capture: "complete",
      comment: "Keep the user-paced controls.",
    });

    await page.getByRole("button", { name: "Finish lesson" }).click();
    await expect(page.getByRole("heading", { name: "Up next: Talk about your morning" })).toBeVisible();
    await expect(page.getByText(`Saved progress · ${displayName}`, { exact: true })).toBeVisible();
    await expect(page.getByText("1/3", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Build my lesson" }).click();

    await expect(page.getByRole("heading", { name: "A coherent path, chosen for you." })).toBeVisible();
    await expect(page.getByText("Talk about your morning", { exact: true })).toBeVisible();
  } finally {
    await cleanupLearner(displayName, learnerId);
  }
});
