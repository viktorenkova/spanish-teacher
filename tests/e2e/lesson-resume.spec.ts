import { expect, test } from "@playwright/test";
import postgres from "postgres";

test("resumes the active lesson at the first incomplete exercise", async ({ page }) => {
  const displayName = `E2E Resume ${Date.now()}`;
  let learnerId: string | undefined;

  try {
    await page.goto("/");
    await page.getByLabel("What should the coach call you?").fill(displayName);
    await page.getByRole("button", { name: "Continue to a short check" }).click();

    await page.getByText("Buenos días", { exact: true }).click();
    await page.getByText("llamo", { exact: true }).click();
    await page.getByText("In Madrid", { exact: true }).click();
    await page.getByText("Desayuno a las ocho.", { exact: true }).click();
    await page.getByRole("button", { name: "Create my learning plan" }).click();

    await expect(page.getByRole("heading", { name: "How much time do you have?" })).toBeVisible();
    learnerId = await page.evaluate(() => localStorage.getItem("spanish-coach:learner-id:v1") ?? undefined);
    await page.getByRole("button", { name: "Build my lesson" }).click();
    await expect(page.getByRole("heading", { name: "A coherent path, chosen for you." })).toBeVisible();
    await page.getByRole("button", { name: "Start the ready practice" }).click();

    await expect(page.getByRole("heading", { name: /What does Lucía mean/ })).toBeVisible();
    await page.getByRole("radio", { name: "Pleased to meet you" }).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByRole("heading", { name: /Choose the natural answer/ })).toBeVisible();

    await page.reload();

    await expect(page.getByRole("heading", { name: /Choose the natural answer/ })).toBeVisible();
    await expect(page.getByText("20%", { exact: true })).toBeVisible();
  } finally {
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
});
