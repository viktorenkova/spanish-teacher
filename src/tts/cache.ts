import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { TtsAudio, TtsProvider, TtsRequest } from "./provider";

type CachedTtsAudio = TtsAudio & { cacheStatus: "hit" | "miss" };

function cacheKey(provider: TtsProvider, request: TtsRequest) {
  return createHash("sha256")
    .update(JSON.stringify({ provider: provider.id, version: provider.cacheVersion, ...request }))
    .digest("hex");
}

export async function synthesizeWithCache(
  provider: TtsProvider,
  request: TtsRequest,
  cacheDirectory: string,
): Promise<CachedTtsAudio> {
  const key = cacheKey(provider, request);
  const audioPath = path.join(cacheDirectory, `${key}.wav`);
  const metadataPath = path.join(cacheDirectory, `${key}.json`);

  try {
    const [bytes, metadata] = await Promise.all([
      readFile(audioPath),
      readFile(metadataPath, "utf8").then(
        (value) => JSON.parse(value) as Pick<TtsAudio, "providerId" | "voiceId">,
      ),
    ]);
    return {
      bytes,
      contentType: "audio/wav",
      providerId: metadata.providerId,
      voiceId: metadata.voiceId,
      cacheStatus: "hit",
    };
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : undefined;
    if (code !== "ENOENT") throw error;
  }

  const generated = await provider.synthesize(request);
  await mkdir(cacheDirectory, { recursive: true });
  await Promise.all([
    writeFile(audioPath, generated.bytes),
    writeFile(
      metadataPath,
      JSON.stringify({
        providerId: generated.providerId,
        voiceId: generated.voiceId,
        contentType: generated.contentType,
      }),
      "utf8",
    ),
  ]);

  return { ...generated, cacheStatus: "miss" };
}
