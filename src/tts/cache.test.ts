import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { synthesizeWithCache } from "./cache";
import type { TtsProvider } from "./provider";

const createdDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(createdDirectories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("TTS cache", () => {
  it("synthesizes once and returns the cached WAV afterwards", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "spanish-coach-tts-"));
    createdDirectories.push(directory);
    const synthesize = vi.fn(async () => ({
      bytes: new Uint8Array([82, 73, 70, 70]),
      contentType: "audio/wav" as const,
      providerId: "test-provider",
      voiceId: "test-es-ES",
    }));
    const provider: TtsProvider = { id: "test-provider", cacheVersion: "1", synthesize };
    const request = { text: "Hola", locale: "es-ES" as const, rate: 0.9 };

    const first = await synthesizeWithCache(provider, request, directory);
    const second = await synthesizeWithCache(provider, request, directory);

    expect(first.cacheStatus).toBe("miss");
    expect(second.cacheStatus).toBe("hit");
    expect(synthesize).toHaveBeenCalledTimes(1);
    expect(Array.from(second.bytes)).toEqual([82, 73, 70, 70]);
  });
});
