import { expect, test, type Page } from "@playwright/test";
import { buildLearnerOverview } from "../../src/domain/learner-overview";
import { createEmptyProgress, lessonCatalog, lessonKeys, type LessonKey } from "../../src/domain/lesson";
import { buildLessonPlan } from "../../src/domain/lesson-planner";
import { installMediaMocks } from "./helpers";

async function openNewLesson(page: Page, lessonKey: LessonKey, width: number) {
  const lesson = lessonCatalog[lessonKey];
  const completedExerciseIds = Object.fromEntries(
    lessonKeys.slice(0, lessonKeys.indexOf(lessonKey)).map((key) => [
      key, lessonCatalog[key].exercises.map((exercise) => exercise.id),
    ]),
  );
  let progress = createEmptyProgress();
  let sessionActive = true;
  const savedPlan = {
    ...buildLessonPlan({ lessonKey, targetMinutes: 10, dueReviewCount: 0, weakestSkills: [] }),
    id: "mock-plan",
    createdAt: new Date().toISOString(),
  };
  const session = {
    id: "mock-session",
    status: "active",
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    plan: savedPlan,
  };
  const summary = () => ({
    introducedItemCount: progress.completedExerciseIds.length,
    reviewedTodayCount: 0,
    dueReviewCount: 0,
    hasCompletedSpeakingTask: Boolean(progress.hasSpokenEvidence),
  });

  await page.setViewportSize({ width, height: 812 });
  await installMediaMocks(page, "El libro está encima de la mesa.");
  await page.addInitScript(() => {
    localStorage.setItem("spanish-coach:learner-id:v1", "new-lessons-test");
  });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith("/api/tts/")) {
      await route.fulfill({ status: 200, contentType: "audio/wav", body: "browser-test-audio" });
      return;
    }
    if (path === "/api/lesson/attempts" || path === "/api/lesson/speaking-attempts") {
      const answer = route.request().postDataJSON() as {
        exerciseId: string;
        selectedOptionId?: string;
        transcript?: string;
        evidenceProvider?: string;
      };
      const exercise = lesson.exercises.find(({ id }) => id === answer.exerciseId);
      if (!exercise) throw new Error(`Unknown exercise: ${answer.exerciseId}`);
      const correct = exercise.speakingTask
        ? Boolean(answer.transcript?.trim())
        : answer.selectedOptionId === exercise.correctOptionId;
      progress = {
        ...progress,
        attempts: progress.attempts + 1,
        correctAnswers: progress.correctAnswers + Number(correct),
        completedExerciseIds: correct
          ? [...progress.completedExerciseIds, exercise.id]
          : progress.completedExerciseIds,
        hasSpokenEvidence: progress.hasSpokenEvidence
          || (correct && Boolean(exercise.speakingTask) && answer.evidenceProvider !== "typed-fallback"),
      };
      await route.fulfill({ status: 201, json: {
        correct,
        feedback: correct ? exercise.successFeedback : exercise.retryFeedback,
        nextReviewAt: new Date().toISOString(),
        progress,
      } });
      return;
    }
    if (path === "/api/lesson/plan" && route.request().method() === "POST") {
      sessionActive = false;
      const nextKey = lessonKeys[Math.min(lessonKeys.indexOf(lessonKey) + 1, lessonKeys.length - 1)];
      await route.fulfill({ json: { plan: {
        ...buildLessonPlan({ lessonKey: nextKey, targetMinutes: 10, dueReviewCount: 0, weakestSkills: [] }),
        id: "next-plan",
        createdAt: new Date().toISOString(),
      } } });
      return;
    }
    if (path === "/api/learner/overview") {
      const evidence = {
        ...completedExerciseIds,
        [lessonKey]: progress.completedExerciseIds,
      };
      await route.fulfill({ json: { overview: buildLearnerOverview({
        learner: {
          displayName: "Lesson tester", overallLevel: "A1", a1Band: "mid",
          primaryGoal: "conversation", preferredSessionMinutes: 10,
        },
        progress: summary(),
        completedLessonCount: lessonKeys.indexOf(lessonKey) + Number(progress.completedExerciseIds.length === lesson.exercises.length),
        completedExerciseIds: evidence,
      }) } });
      return;
    }
    const responses: Record<string, object> = {
      "/api/lesson/sessions": { session: sessionActive ? session : null },
      "/api/lesson/progress": { progress, summary: summary() },
      "/api/teacher/feedback": { teacherFeedback: null },
      "/api/mistakes": { mistakeMemory: null },
      "/api/pilot-feedback": { feedback: null },
      "/api/learning-journey/choice": { recorded: true },
      "/api/learner/history": { history: [] },
      "/api/learner/rhythm": {},
    };
    if (!(path in responses)) throw new Error(`Unexpected API request: ${path}`);
    await route.fulfill({ json: responses[path] });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: lesson.exercises[0].prompt })).toBeVisible();
  return lesson;
}

for (const { lessonKey, width, answer } of [
  { lessonKey: "at-home-v1" as const, width: 1280, answer: "El libro está encima de la mesa." },
  { lessonKey: "work-study-v1" as const, width: 390, answer: "Estudio español." },
  { lessonKey: "neighbourhood-v1" as const, width: 1280, answer: "Hay una panadería cerca de mi casa." },
  { lessonKey: "ask-for-help-v1" as const, width: 390, answer: "No encuentro mi mochila. ¿Me ayudas, por favor?" },
  { lessonKey: "invite-a-friend-v1" as const, width: 1280, answer: "¿Quieres venir a mi casa el sábado?" },
  { lessonKey: "reply-to-invitation-v1" as const, width: 390, answer: "Sí, puedo el sábado." },
  { lessonKey: "choose-an-activity-v1" as const, width: 1280, answer: "Prefiero ir al parque." },
]) {
  test(`${lessonKey} runs from teaching through completion at ${width}px`, async ({ page }) => {
    const lesson = await openNewLesson(page, lessonKey, width);
    await expect(page.getByRole("region", { name: "Learn before practising" })).toBeVisible();
    for (const exercise of lesson.exercises) {
      await expect(page.getByRole("heading", { name: exercise.prompt })).toBeVisible();
      if (exercise.listeningClipId) {
        await page.getByRole("button", { name: "Play Spanish audio" }).click();
      }
      if (exercise.speakingTask) {
        await page.getByRole("button", { name: "Use a typed answer instead" }).click();
        await page.getByLabel("Type your answer in Spanish").fill(answer);
        await page.getByRole("button", { name: "Check typed answer" }).click();
      } else {
        await page.getByRole("radio", { name: exercise.options.find(({ id }) => id === exercise.correctOptionId)?.label }).click();
        await page.getByRole("button", { name: "Check answer" }).click();
      }
      await page.getByRole("button", { name: exercise === lesson.exercises.at(-1) ? "View lesson summary" : "Continue" }).click();
    }
    await expect(page.getByRole("heading", { name: lesson.completionTitle })).toBeVisible();
    await expect(page.getByText("A typed fallback is not counted as speaking.")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (lessonKey === lessonKeys.at(-1)) {
      await expect(page.getByRole("button", { name: "Return to Today" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Continue to the next lesson|Continue:/ })).toHaveCount(0);
      await page.getByRole("button", { name: "Return to Today" }).click();
      await expect(page.getByRole("tab", { name: "Today" })).toBeVisible();
    } else if (lessonKey === lessonKeys.at(-2)) {
      await expect(page.locator(".completion-actions .primary-button")).toContainText("Continue");
      await page.locator(".completion-actions .primary-button").click();
      await expect(page.getByRole("heading", { name: new RegExp(`Ready for “${lessonCatalog[lessonKeys.at(-1)!].title}”`) })).toBeVisible();
    }
    if (lessonKey === "at-home-v1") {
      await page.locator(".completion-actions .primary-button").click();
      await expect(page.getByRole("heading", { name: /Ready for “Talk about work and study”/ })).toBeVisible();
    }
  });
}
