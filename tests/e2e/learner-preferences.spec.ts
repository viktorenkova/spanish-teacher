import { expect, test } from "@playwright/test";
import {
  cleanupLearner,
  completeOnboarding,
  loadLatestPlanTargetMinutes,
  loadLearnerPreferences,
} from "./helpers";

test("persists learning preferences and uses the default lesson duration", async ({ page }) => {
  const displayName = `E2E Preferences ${Date.now()}`;
  let learnerId: string | undefined;

  try {
    learnerId = await completeOnboarding(page, displayName);
    if (!learnerId) throw new Error("Onboarding did not persist a learner ID.");

    const invalidUpdate = await page.request.patch("/api/learner/profile", {
      data: {
        learnerId,
        preferredSessionMinutes: 12,
      },
    });
    expect(invalidUpdate.status()).toBe(400);
    expect(await loadLearnerPreferences(learnerId)).toMatchObject({
      primary_goal: "conversation",
      preferred_session_minutes: 10,
    });

    await page.getByRole("button", { name: "Manage profile" }).click();
    await page.getByLabel("Main learning goal").selectOption("travel");
    await page.getByRole("radio", { name: "20 min" }).check();
    await page.getByRole("button", { name: "Save learning preferences" }).click();

    await expect(page.getByRole("status")).toHaveText("Learning preferences updated.");
    expect(await loadLearnerPreferences(learnerId)).toMatchObject({
      primary_goal: "travel",
      preferred_session_minutes: 20,
    });

    await page.reload();
    const defaultDuration = page.getByRole("button", { name: "20 min" });
    await expect(defaultDuration).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Build my lesson" }).click();
    expect(await loadLatestPlanTargetMinutes(learnerId)).toBe(20);
  } finally {
    await cleanupLearner(displayName, learnerId);
  }
});
