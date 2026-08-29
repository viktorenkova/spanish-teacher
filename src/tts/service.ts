import "server-only";
import path from "node:path";
import { getServerEnvironment } from "@/server/config/environment";
import { synthesizeWithCache } from "./cache";
import { PiperTtsProvider } from "./piper-provider";
import type { TtsRequest } from "./provider";

export async function synthesizeServerAudio(request: TtsRequest) {
  const environment = getServerEnvironment();
  const executable = environment.PIPER_EXECUTABLE;
  const modelPath = environment.PIPER_MODEL_PATH;
  if (!executable || !modelPath) throw new Error("SERVER_TTS_NOT_CONFIGURED");

  const provider = new PiperTtsProvider({
    executable,
    modelPath,
    modelConfigPath: environment.PIPER_MODEL_CONFIG_PATH,
    voiceId: environment.PIPER_VOICE_ID,
  });
  const cacheDirectory = path.resolve(
    /* turbopackIgnore: true */ environment.TTS_CACHE_DIR,
  );
  return synthesizeWithCache(provider, request, cacheDirectory);
}
