import { expect, test } from "@playwright/test";

test("interface sounds can be turned off and stay off after reload", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as typeof window & { __cueStarts?: number };
    state.__cueStarts = 0;
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: class {
        state = "running";
        currentTime = 0;
        destination = {};
        createOscillator() {
          return {
            type: "sine",
            frequency: { value: 0 },
            connect() {},
            start() { state.__cueStarts = (state.__cueStarts ?? 0) + 1; },
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

  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Turn interface sounds off" });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("What should the coach call you?").fill("Sound learner");
  await page.getByRole("button", { name: "Continue to a short check" }).click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __cueStarts?: number }).__cueStarts)).toBe(1);

  await toggle.click();
  await expect(page.getByRole("button", { name: "Turn interface sounds on" })).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await expect(page.getByRole("button", { name: "Turn interface sounds on" })).toHaveAttribute("aria-pressed", "false");
  await page.getByLabel("What should the coach call you?").fill("Sound learner");
  await page.getByRole("button", { name: "Continue to a short check" }).click();
  expect(await page.evaluate(() => (window as typeof window & { __cueStarts?: number }).__cueStarts)).toBe(0);
});
