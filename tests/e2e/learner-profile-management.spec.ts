import { expect, test } from "@playwright/test";
import {
  cleanupLearner,
  completeOnboarding,
  loadLearnerDisplayName,
} from "./helpers";

test("renames a learner and protects permanent deletion with the exact name", async ({ page }) => {
  const originalName = `E2E Profile ${Date.now()}`;
  const renamedName = `${originalName} Renamed`;
  let learnerId: string | undefined;

  try {
    learnerId = await completeOnboarding(page, originalName);
    if (!learnerId) throw new Error("Onboarding did not persist a learner ID.");

    const rejectedDelete = await page.request.delete("/api/learner/profile", {
      data: {
        learnerId,
        confirmationDisplayName: "wrong name",
      },
    });
    expect(rejectedDelete.status()).toBe(409);
    expect(await loadLearnerDisplayName(learnerId)).toBe(originalName);

    await page.getByRole("button", { name: "Manage profile" }).click();
    await page.getByLabel("Learner name").fill(renamedName);
    await page.getByRole("button", { name: "Save name" }).click();

    await expect(page.getByRole("status")).toHaveText("Learner name updated.");
    await expect(page.getByText(`Saved progress · ${renamedName}`, { exact: true })).toBeVisible();
    expect(await loadLearnerDisplayName(learnerId)).toBe(renamedName);

    await page.getByRole("button", { name: "Delete profile and progress" }).click();
    const deleteButton = page.getByRole("button", { name: "Permanently delete profile" });
    await expect(deleteButton).toBeDisabled();
    await page.getByLabel(`Type ${renamedName} to confirm`).fill(renamedName);
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    await expect(page.getByRole("heading", { name: "Let the coach plan for you." })).toBeVisible();
    expect(await loadLearnerDisplayName(learnerId)).toBeUndefined();
    expect(await page.evaluate(() => localStorage.getItem("spanish-coach:learner-id:v1"))).toBeNull();
  } finally {
    await cleanupLearner(originalName, learnerId);
    await cleanupLearner(renamedName, learnerId);
  }
});
