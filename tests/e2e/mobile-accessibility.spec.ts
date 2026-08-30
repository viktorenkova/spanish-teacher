import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
});

test("keeps onboarding usable on mobile with semantic labels and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Learn Spanish that feels good to use." })).toBeVisible();
  const nameInput = page.getByLabel("What should the coach call you?");
  await expect(nameInput).toBeVisible();
  await expect(nameInput).toBeEnabled();
  await nameInput.focus();
  await expect(nameInput).toBeFocused();

  const initialAudit = await page.evaluate(() => ({
    duplicateIds: Array.from(document.querySelectorAll("[id]"))
      .map((element) => element.id)
      .filter((id, index, ids) => ids.indexOf(id) !== index),
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    reducedScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  expect(initialAudit.duplicateIds).toEqual([]);
  expect(initialAudit.hasHorizontalOverflow).toBe(false);
  expect(initialAudit.reducedScrollBehavior).toBe("auto");

  await nameInput.fill("Mobile learner");
  await page.getByRole("button", { name: "Continue to a short check" }).click();
  await expect(page.getByRole("heading", { name: "Show what is already familiar." })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(12);
  await expect(page.locator("fieldset > legend")).toHaveCount(4);

  const diagnosticAudit = await page.evaluate(() => ({
    duplicateIds: Array.from(document.querySelectorAll("[id]"))
      .map((element) => element.id)
      .filter((id, index, ids) => ids.indexOf(id) !== index),
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  expect(diagnosticAudit.duplicateIds).toEqual([]);
  expect(diagnosticAudit.hasHorizontalOverflow).toBe(false);
});
