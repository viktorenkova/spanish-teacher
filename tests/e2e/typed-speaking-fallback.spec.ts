import { expect, test } from "@playwright/test";
import { cleanupLearner, completeOnboarding } from "./helpers";

test("a mobile learner can finish with a typed answer without receiving speaking credit", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const displayName = `E2E Typed Fallback ${Date.now()}`;
  let learnerId: string | undefined;

  try {
    learnerId = await completeOnboarding(page, displayName);
    await page.getByRole("button", { name: "Build today’s lesson" }).click();
    await page.getByRole("button", { name: "Start the ready practice" }).click();
    for (const answer of ["Pleased to meet you", "Me llamo Kate.", "Madrid", "Soy de Inglaterra."]) {
      if (answer === "Madrid") {
        await page.getByRole("button", { name: /Play Spanish audio/ }).click();
      }
      await page.getByRole("radio", { name: answer }).click();
      await page.getByRole("button", { name: "Check answer" }).click();
      await page.getByRole("button", { name: "Continue" }).click();
    }

    await page.getByRole("button", { name: "Use a typed answer instead" }).click();
    await page.getByRole("textbox", { name: "Type your answer in Spanish" })
      .fill("Me llamo Katia. Soy de Madrid.");
    await page.getByRole("button", { name: "Check typed answer" }).click();
    await expect(page.getByRole("status")).toContainText("Speaking was not checked");
    await page.getByRole("button", { name: "View lesson summary" }).click();
    await expect(page.getByText(/speaking is still to practise/)).toBeVisible();
    await page.getByRole("tab", { name: "Progress" }).click();
    await expect(page.locator(".lesson-history-entry").getByText("Not yet")).toBeVisible();
  } finally {
    await cleanupLearner(displayName, learnerId);
  }
});
