import "server-only";
import path from "node:path";
import { synthesizeWithCache } from "./cache";
import { PiperTtsProvider } from "./piper-provider";
import type { TtsRequest } from "./provider";

export async function synthesizeServerAudio(request: TtsRequest) {
  const executable = process.env.PIPER_EXECUTABLE;
  const modelPath = process.env.PIPER_MODEL_PATH;
  if (!executable || !modelPath) throw new Error("SERVER_TTS_NOT_CONFIGURED");

  const provider = new PiperTtsProvider({
    executable,
    modelPath,
    modelConfigPath: process.env.PIPER_MODEL_CONFIG_PATH || undefined,
    voiceId: process.env.PIPER_VOICE_ID || "es_ES-local",
  });
  const cacheDirectory = path.resolve(
    /* turbopackIgnore: true */ process.env.TTS_CACHE_DIR || ".data/tts-cache",
  );
  return synthesizeWithCache(provider, request, cacheDirectory);
}
