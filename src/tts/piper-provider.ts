import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { TtsAudio, TtsProvider, TtsRequest } from "./provider";

type PiperProviderOptions = {
  executable: string;
  modelPath: string;
  modelConfigPath?: string;
  voiceId: string;
};

export class PiperTtsProvider implements TtsProvider {
  readonly id = "piper-local";
  readonly cacheVersion = "piper-cli-v1";

  constructor(private readonly options: PiperProviderOptions) {}

  async synthesize(request: TtsRequest): Promise<TtsAudio> {
    const outputPath = path.join(tmpdir(), `spanish-coach-${randomUUID()}.wav`);
    const args = ["--model", this.options.modelPath, "--output_file", outputPath];
    if (this.options.modelConfigPath) args.push("--config", this.options.modelConfigPath);
    args.push("--length_scale", String(1 / request.rate), "--", request.text);

    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(this.options.executable, args, { windowsHide: true, stdio: "ignore" });
        child.once("error", reject);
        child.once("exit", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Piper exited with code ${code ?? "unknown"}.`));
        });
      });
      return {
        bytes: await readFile(outputPath),
        contentType: "audio/wav",
        providerId: this.id,
        voiceId: this.options.voiceId,
      };
    } finally {
      await unlink(outputPath).catch(() => undefined);
    }
  }
}
