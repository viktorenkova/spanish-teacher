import { expect, test, type Page } from "@playwright/test";
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

async function openPhrasebook(page: Page, width: number, savedOverview = overview) {
    await page.setViewportSize({ width, height: 812 });
    await installMediaMocks(page, "Un café, por favor.");
    await page.addInitScript(() => {
      localStorage.setItem("spanish-coach:learner-id:v1", "phrasebook-test");
    });
    // These UI checks use fixed API responses and need no local database.
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      const responses: Record<string, object> = {
        "/api/learner/overview": { overview: savedOverview },
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
}

for (const width of [1280, 375]) {
  test(`searches saved phrases and keeps speaking usable at ${width}px`, async ({ page }) => {
    await openPhrasebook(page, width);
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
    await expect(phrasebook.getByRole("button", { name: "Practise from memory" })).toBeDisabled();
    await expect(phrasebook.getByRole("button", { name: "Clear search" })).toBeDisabled();
    await results.getByRole("button", { name: "Stop practising Un café, por favor." }).click();
    await expect(search).toBeEnabled();
    await expect(results).toContainText("Pronunciation was not assessed");
    await search.fill("good morning");
    await expect(results).toHaveCount(1);
    await expect(results).toContainText("Buenos días.");
    await search.fill("not-in-my-phrasebook");
    await expect(results).toHaveCount(0);
    await expect(phrasebook.getByRole("button", { name: "Practise from memory" })).toBeDisabled();
    await expect(phrasebook.getByRole("status")).toContainText("No phrases found");
    await phrasebook.getByRole("button", { name: "Clear search" }).click();
    await expect(search).toHaveValue("");
    await expect(results).toHaveCount(3);
    await search.fill("   ");
    await expect(results).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test(`recalls a short set, retries difficult phrases and returns to search at ${width}px`, async ({ page }) => {
    await openPhrasebook(page, width, {
      ...overview,
      phrasebook: [...overview.phrasebook, ...[
        { id: "thanks", targetText: "Gracias.", supportText: "Thank you." },
        { id: "bye", targetText: "Hasta luego.", supportText: "See you later." },
        { id: "water", targetText: "Agua, por favor.", supportText: "Water, please." },
      ]],
    });
    const start = page.getByRole("button", { name: "Practise from memory" });
    await start.click();
    const practice = page.getByRole("region", { name: /Say it from memory|Memory practice complete/ });
    await expect(practice.getByRole("heading")).toBeFocused();
    await expect(practice.getByRole("heading")).toHaveText("Say it from memory · 1 of 5");
    await expect(page.getByRole("searchbox")).toBeHidden();
    await expect(page.getByText("Un café, por favor.", { exact: true })).toBeHidden();
    await expect(practice.getByRole("button", { name: "I remembered it" })).toHaveCount(0);
    for (let index = 0; index < 5; index += 1) {
      await expect(practice.getByRole("heading")).toHaveText(`Say it from memory · ${index + 1} of 5`);
      await page.keyboard.press("Tab");
      await expect(practice.getByRole("button", { name: "Reveal Spanish" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(practice.locator(".phrasebook-recall-answer")).toBeFocused();
      await practice.getByRole("button", { name: index === 0 ? "I needed help" : "I remembered it" }).click();
    }
    await expect(practice).toContainText("You marked 4 of 5 phrases as remembered");
    await practice.getByRole("button", { name: "Try difficult phrases again" }).click();
    await expect(practice.getByRole("heading")).toHaveText("Say it from memory · 1 of 1");
    await expect(practice).toContainText("A coffee, please.");
    await practice.getByRole("button", { name: "Reveal Spanish" }).click();
    await practice.getByRole("button", { name: "I remembered it" }).click();
    await expect(practice).toContainText("You marked 1 of 1 phrases as remembered");
    await expect(practice.getByRole("button", { name: "Try difficult phrases again" })).toHaveCount(0);
    await practice.getByRole("button", { name: "Back to phrasebook" }).click();
    await expect(start).toBeFocused();
    await page.getByRole("searchbox").fill("morning");
    await start.click();
    await expect(practice).toContainText("Good morning.");
    await expect(practice.getByRole("heading")).toHaveText("Say it from memory · 1 of 1");
    await practice.getByRole("button", { name: "Back to phrasebook" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("morning");
    await start.click();
    await expect(practice.getByRole("button", { name: "Reveal Spanish" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
