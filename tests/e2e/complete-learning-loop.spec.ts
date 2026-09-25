import { expect, test, type Page } from "@playwright/test";
import {
  cleanupLearner,
  completeOnboarding,
  installMediaMocks,
  loadJourneyChoices,
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
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  const displayName = `E2E Full Loop ${Date.now()}`;
  let learnerId: string | undefined;

  try {
    await page.addInitScript(() => {
      const state = window as typeof window & { __cueFrequencies?: number[] };
      state.__cueFrequencies = [];
      Object.defineProperty(window, "AudioContext", {
        configurable: true,
        value: class {
          state = "running";
          currentTime = 0;
          destination = {};
          createOscillator() {
            const frequency = { value: 0 };
            return {
              type: "sine",
              frequency,
              connect() {},
              start() { state.__cueFrequencies?.push(frequency.value); },
              stop() {},
            };
          }
          createGain() {
            return {
              gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
              connect() {},
            };
          }
          close() { return Promise.resolve(); }
        },
      });
    });
    await installMediaMocks(page, "Me llamo Katia. Soy de Madrid.");
    learnerId = await completeOnboarding(page, displayName);
    if (!learnerId) throw new Error("Onboarding did not persist a learner ID.");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Build today’s lesson" }).click();
    await expect(page.getByRole("button", { name: "Start the ready practice" })).toBeInViewport();
    await page.getByRole("button", { name: "Start the ready practice" }).click();
    const activeSessionResponse = await page.request.get(`/api/lesson/sessions?learnerId=${learnerId}`);
    const activeSession = (await activeSessionResponse.json()) as { session: { id: string } };
    const prematureChoice = await page.request.post("/api/learning-journey/choice", {
      data: { learnerId, sessionId: activeSession.session.id, choice: "next_lesson" },
    });
    expect(prematureChoice.status()).toBe(409);

    await page.getByRole("radio", { name: "See you tomorrow" }).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    const retryFeedback = page.locator("p.feedback.retry");
    await expect(retryFeedback).toContainText("Not quite", { timeout: 15_000 });
    expect(await page.evaluate(() => (window as typeof window & { __cueFrequencies?: number[] }).__cueFrequencies))
      .toEqual(expect.arrayContaining([392, 349]));
    await page.waitForTimeout(1_300);
    await expect(retryFeedback).toBeVisible();

    await answerChoice(page, "Pleased to meet you", /Choose the natural answer/, true);
    expect(await page.evaluate(() => (window as typeof window & { __cueFrequencies?: number[] }).__cueFrequencies))
      .toEqual(expect.arrayContaining([523, 659]));
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
    await expect(page.getByRole("button", { name: /^Continue/ })).toBeInViewport();
    await page.getByText("Review lesson details", { exact: true }).click();
    await expect(page.getByText(/speaking task completed/)).toBeVisible();
    await page.getByText("Rate this lesson", { exact: false }).click();
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

    await page.getByRole("button", { name: /^Continue/ }).click();
    await expect(page.getByRole("heading", { name: "Ready for “Talk about your morning”?" })).toBeVisible();
    await expect.poll(async () => (await loadJourneyChoices(learnerId!)).map(({ choice }) => choice))
      .toEqual(["next_lesson"]);
    const repeatedChoice = await page.request.post("/api/learning-journey/choice", {
      data: { learnerId, sessionId: activeSession.session.id, choice: "next_lesson" },
    });
    expect(repeatedChoice.status()).toBe(200);
    expect(await loadJourneyChoices(learnerId)).toHaveLength(1);
    await page.getByRole("button", { name: "Choose another duration" }).click();
    await expect(page.getByRole("tab", { name: "Today" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: "Talk about your morning" })).toBeVisible();
    await page.getByRole("tab", { name: "Progress" }).click();
    await expect(page.getByRole("heading", { name: "Your practice rhythm" })).toBeVisible();
    const practiceRhythm = page.locator(".practice-rhythm");
    await expect(practiceRhythm).toContainText("You have practised today");
    await expect(
      practiceRhythm.locator("dl div").filter({ hasText: "Active days · 7" }),
    ).toContainText("1");
    await expect(
      practiceRhythm.locator("dl div").filter({ hasText: "Current rhythm" }),
    ).toContainText("1 day");
    await expect(page.getByRole("heading", { name: "Recent lessons" })).toBeVisible();
    const recentLesson = page.locator(".lesson-history-entry");
    await expect(recentLesson).toContainText("Meet someone new");
    await expect(recentLesson).toContainText(
      "Your first completed lesson is now saved.",
    );
    await expect(recentLesson.getByText("Speaking", { exact: true })).toBeVisible();
    await expect(recentLesson.getByText("Done", { exact: true })).toBeVisible();
    await expect(page.getByText(`Saved progress · ${displayName}`, { exact: true })).toBeVisible();
    await expect(
      page.locator(".learner-overview-progress").getByText("1/12", { exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Review" }).click();
    await expect.poll(async () => (await loadJourneyChoices(learnerId!)).map(({ choice }) => choice))
      .toContain("review");
    await expect(page.getByRole("heading", { name: "Practise 5 saved phrases" })).toBeVisible();
    await page.locator("details.phrasebook > summary").click();
    await page.getByRole("button", { name: "Practise saying Me llamo…", exact: true }).first().click();
    await expect(page.getByText(/Listening… Say the phrase/)).toBeVisible();
    await page.getByRole("button", { name: "Stop practising Me llamo…", exact: true }).click();
    await expect(page.getByText("Me llamo Katia. Soy de Madrid.", { exact: true })).toBeVisible();
    await expect(page.getByText(/Pronunciation was not assessed/)).toBeVisible();
    await page.getByRole("tab", { name: "Today" }).click();
    await page.getByRole("button", { name: "Build today’s lesson" }).click();

    await expect(page.getByRole("heading", { name: "Ready for “Talk about your morning”?" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(browserErrors).toEqual([]);
  } finally {
    await cleanupLearner(displayName, learnerId);
  }
});

test("mobile learner finishes for today, reviews phrases, and keeps saved progress", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const displayName = `E2E Mobile Journey ${Date.now()}`;
  const browserErrors: string[] = [];
  const undersizedTargets: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  let learnerId: string | undefined;

  async function auditScreen(stage: string) {
    const audit = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      duplicateIds: Array.from(document.querySelectorAll("[id]"))
        .map((element) => element.id)
        .filter((id, index, ids) => ids.indexOf(id) !== index),
      headingCount: Array.from(document.querySelectorAll("main h2"))
        .filter((heading) => heading.getClientRects().length > 0).length,
      undersizedTargets: Array.from(document.querySelectorAll("main button, main a, main summary, main select, main label:has(input[type=radio])"))
        .filter((element) => {
          const style = getComputedStyle(element);
          return element.getClientRects().length > 0 && style.visibility !== "hidden";
        })
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return box.width < 44 || box.height < 44;
        })
        .map((element) => `${element.tagName.toLowerCase()} "${element.textContent?.trim().slice(0, 45)}"`),
    }));
    expect(audit.overflow).toBe(false);
    expect(audit.duplicateIds).toEqual([]);
    expect(audit.headingCount).toBeGreaterThan(0);
    undersizedTargets.push(...audit.undersizedTargets.map((target) => `${stage}: ${target}`));
  }

  async function assertFirstViewportAction(name: string) {
    const action = page.getByRole("button", { name });
    await expect(action).toBeInViewport();
    const box = await action.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }

  try {
    await installMediaMocks(page, "Me llamo Katia. Soy de Madrid.");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Learn Spanish that feels good to use." })).toBeVisible();
    await auditScreen("welcome");
    await assertFirstViewportAction("Continue to a short check");
    const firstActionBottom = await page.getByRole("button", { name: "Continue to a short check" })
      .evaluate((button) => button.getBoundingClientRect().bottom);
    expect(firstActionBottom).toBeLessThanOrEqual(844 - 48);
    await page.locator(".onboarding-preferences > summary").click();
    await expect(page.getByLabel("Your main goal")).toBeVisible();
    await page.locator(".onboarding-preferences > summary").click();
    const nameInput = page.getByLabel("What should the coach call you?");
    await nameInput.focus();
    expect(await nameInput.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
    await nameInput.fill(displayName);
    await page.getByRole("button", { name: "Continue to a short check" }).click();
    await expect(page.getByRole("heading", { name: "Show what is already familiar." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Learn Spanish that feels good to use." })).toBeHidden();
    await auditScreen("diagnostic");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
    await expect(page.getByText("Four quick questions, with no pass or fail.", { exact: false })).toBeVisible();
    await expect(page.locator("fieldset > legend")).toHaveCount(4);
    await page.getByText("Buenos días", { exact: true }).click();
    await page.getByText("llamo", { exact: true }).click();
    await page.getByText("In Madrid", { exact: true }).click();
    await page.getByText("Desayuno a las ocho.", { exact: true }).click();
    await page.getByRole("button", { name: "Create my learning plan" }).click();
    await page.getByRole("button", { name: "Build today’s lesson" }).waitFor();
    learnerId = await page.evaluate(() => localStorage.getItem("spanish-coach:learner-id:v1") ?? undefined);
    if (!learnerId) throw new Error("Onboarding did not persist a learner ID.");
    await auditScreen("dashboard");
    await page.getByRole("button", { name: "Build today’s lesson" }).click();
    await expect(page.getByRole("heading", { name: "Ready for “Meet someone new”?" })).toBeVisible();
    await auditScreen("plan");
    const start = page.getByRole("button", { name: "Start the ready practice" });
    await assertFirstViewportAction("Start the ready practice");
    await start.click();
    await expect(page.getByRole("heading", { name: /What does Lucía mean/ })).toBeVisible();
    await auditScreen("lesson");

    await answerChoice(page, "Pleased to meet you", /Choose the natural answer/);
    await answerChoice(page, "Me llamo Kate.", /Where is Lucía from/);
    await answerChoice(page, "Madrid", /Which answer matches/);
    await answerChoice(page, "Soy de Inglaterra.", /Introduce yourself aloud/);
    await page.getByRole("button", { name: /Start microphone/ }).click();
    await page.getByRole("button", { name: /Stop listening/ }).click();
    await page.getByRole("button", { name: "Check spoken answer" }).click();
    await page.getByRole("button", { name: "View lesson summary" }).click();

    await expect(page.getByRole("heading", { name: "You can make a first introduction." })).toBeVisible();
    await assertFirstViewportAction("Finish for today");
    await assertFirstViewportAction("Continue: Talk about your morning");
    await auditScreen("completion");
    await page.getByRole("button", { name: "Finish for today" }).click();
    await expect(page.getByRole("button", { name: "Build today’s lesson" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Talk about your morning" })).toBeVisible();
    await page.getByRole("tab", { name: "Progress" }).click();
    await expect(page.getByRole("heading", { name: "Recent lessons" })).toBeVisible();
    await expect(page.locator(".learner-overview-progress").getByText("1/12", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Review" }).click();
    await expect.poll(async () => (await loadJourneyChoices(learnerId!)).map(({ choice }) => choice))
      .toEqual(["review"]);
    await page.getByRole("button", { name: "Start phrase practice" }).click();
    const practice = page.getByRole("region", { name: /Say it from memory|Memory practice complete/ });
    await expect(practice.getByRole("heading")).toHaveText("Say it from memory · 1 of 5");
    await expect(page.locator(".dashboard-tabs")).toBeHidden();
    await auditScreen("review");
    for (let index = 0; index < 5; index += 1) {
      await practice.getByRole("button", { name: "Reveal Spanish" }).click();
      await practice.getByRole("button", { name: "I remembered it" }).click();
    }
    await expect(practice.getByRole("heading")).toHaveText("Memory practice complete");
    await practice.getByRole("button", { name: "Return to Today" }).click();
    await expect(page.getByRole("tab", { name: "Today" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Build today’s lesson" })).toBeVisible();
    await expect(browserErrors).toEqual([]);
    expect(undersizedTargets).toEqual([]);
  } finally {
    await cleanupLearner(displayName, learnerId);
  }
});
