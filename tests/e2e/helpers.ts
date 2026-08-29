import type { Page } from "@playwright/test";
import postgres from "postgres";

export async function completeOnboarding(page: Page, displayName: string) {
  await page.goto("/");
  await page.getByLabel("What should the coach call you?").fill(displayName);
  await page.getByRole("button", { name: "Continue to a short check" }).click();

  await page.getByText("Buenos días", { exact: true }).click();
  await page.getByText("llamo", { exact: true }).click();
  await page.getByText("In Madrid", { exact: true }).click();
  await page.getByText("Desayuno a las ocho.", { exact: true }).click();
  await page.getByRole("button", { name: "Create my learning plan" }).click();

  await page.getByRole("heading", { name: "How much time do you have?" }).waitFor();
  return page.evaluate(() => localStorage.getItem("spanish-coach:learner-id:v1") ?? undefined);
}

export async function cleanupLearner(displayName: string, learnerId?: string) {
  const databaseUrl = process.env.DATABASE_URL
    ?? "postgres://spanish_coach:spanish_coach@127.0.0.1:5432/spanish_coach";
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    if (learnerId) {
      await sql`delete from learners where id = ${learnerId} and display_name = ${displayName}`;
    } else {
      await sql`delete from learners where display_name = ${displayName}`;
    }
  } finally {
    await sql.end();
  }
}

export async function loadLatestPilotFeedback(learnerId: string) {
  const databaseUrl = process.env.DATABASE_URL
    ?? "postgres://spanish_coach:spanish_coach@127.0.0.1:5432/spanish_coach";
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    const [feedback] = await sql<{
      overall_rating: number;
      pacing: string;
      reading_time: string;
      microphone_capture: string;
      comment: string | null;
    }[]>`
      select overall_rating, pacing, reading_time, microphone_capture, comment
      from pilot_feedback
      where learner_id = ${learnerId}
      order by created_at desc
      limit 1
    `;
    return feedback;
  } finally {
    await sql.end();
  }
}

export async function installMediaMocks(page: Page, transcript: string) {
  await page.addInitScript((mockTranscript) => {
    class MockSpeechRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult: ((event: {
        results: Array<{ 0: { transcript: string; confidence: number }; isFinal: boolean }>;
      }) => void) | null = null;
      onerror = null;
      onnomatch = null;
      onend: (() => void) | null = null;

      start() {
        window.setTimeout(() => {
          this.onresult?.({
            results: [{
              0: { transcript: mockTranscript, confidence: 0.99 },
              isFinal: true,
            }],
          });
        }, 10);
      }

      stop() {
        window.setTimeout(() => this.onend?.(), 10);
      }
      abort() {}
    }

    class MockAudio {
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;

      play() {
        window.setTimeout(() => this.onended?.(), 10);
        return Promise.resolve();
      }
    }

    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: MockSpeechRecognition,
    });
    Object.defineProperty(window, "Audio", {
      configurable: true,
      value: MockAudio,
    });
  }, transcript);

  await page.route("**/api/tts/**", (route) => route.fulfill({
    status: 200,
    contentType: "audio/wav",
    body: "browser-test-audio",
  }));
}
