import { expect, test } from "@playwright/test";
import { buildLearnerOverview } from "../../src/domain/learner-overview";
import { installMediaMocks } from "./helpers";

const overview = buildLearnerOverview({
  learner: {
    displayName: "Phrasebook learner",
    overallLevel: "A1",
    a1Band: "early",
    primaryGoal: "conversation",
    preferredSessionMinutes: 10,
  },
  progress: {
    introducedItemCount: 3,
    reviewedTodayCount: 0,
    dueReviewCount: 0,
    hasCompletedSpeakingTask: false,
  },
  completedLessonCount: 0,
  completedExerciseIds: {},
  phrasebook: [
    { id: "coffee", targetText: "Un café, por favor.", supportText: "A coffee, please." },
    { id: "name", targetText: "Me llamo…", supportText: "My name is…" },
    { id: "morning", targetText: "Buenos días.", supportText: "Good morning." },
  ],
});

for (const width of [1280, 375]) {
  test(`searches saved phrases and keeps speaking usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await installMediaMocks(page, "Un café, por favor.");
    await page.addInitScript(() => {
      localStorage.setItem("spanish-coach:learner-id:v1", "phrasebook-test");
    });
    // These UI checks use fixed API responses and need no local database.
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      const responses: Record<string, object> = {
        "/api/learner/overview": { overview },
        "/api/lesson/sessions": { session: null },
        "/api/lesson/plan": { plan: null },
        "/api/learner/history": { history: [] },
        "/api/learner/rhythm": {},
      };
      if (!(path in responses)) throw new Error(`Unexpected API request: ${path}`);
      await route.fulfill({ json: responses[path] });
    });
    await page.goto("/");
    await page.locator("details.phrasebook > summary").click();
    const phrasebook = page.locator("details.phrasebook");
    const search = page.getByRole("searchbox", { name: "Find a phrase" });
    const results = phrasebook.locator("li");
    await expect(results).toHaveCount(3);
    await search.fill("  CAFE  ");
    await expect(results).toHaveCount(1);
    await expect(results).toContainText("Un café, por favor.");
    await expect(phrasebook.getByRole("status")).toHaveText("1 of 3 phrases");
    await expect(results.getByText("A coffee, please.", { exact: true })).toBeHidden();
    await results.getByText("Show meaning", { exact: true }).click();
    await expect(results.getByText("A coffee, please.", { exact: true })).toBeVisible();
    await results.getByRole("button", { name: "Practise saying Un café, por favor." }).click();
    await expect(search).toBeDisabled();
    await expect(phrasebook.getByRole("button", { name: "Clear search" })).toBeDisabled();
    await results.getByRole("button", { name: "Stop practising Un café, por favor." }).click();
    await expect(search).toBeEnabled();
    await expect(results).toContainText("Pronunciation was not assessed");
    await search.fill("good morning");
    await expect(results).toHaveCount(1);
    await expect(results).toContainText("Buenos días.");
    await search.fill("not-in-my-phrasebook");
    await expect(results).toHaveCount(0);
    await expect(phrasebook.getByRole("status")).toContainText("No phrases found");
    await phrasebook.getByRole("button", { name: "Clear search" }).click();
    await expect(search).toHaveValue("");
    await expect(results).toHaveCount(3);
    await search.fill("   ");
    await expect(results).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
