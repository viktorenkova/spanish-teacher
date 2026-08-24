import { NextResponse } from "next/server";
import { getListeningClip } from "@/domain/listening";
import { synthesizeServerAudio } from "@/tts/service";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/tts/[clipId]">) {
  const { clipId } = await context.params;
  const clip = getListeningClip(clipId);
  if (!clip) {
    return NextResponse.json({ error: "Unknown listening clip." }, { status: 404 });
  }

  try {
    const audio = await synthesizeServerAudio({ text: clip.text, locale: clip.locale, rate: clip.rate });
    return new Response(new Blob([new Uint8Array(audio.bytes)]), {
      headers: {
        "Content-Type": audio.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-TTS-Provider": audio.providerId,
        "X-TTS-Voice": audio.voiceId,
        "X-TTS-Cache": audio.cacheStatus,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SERVER_TTS_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Server TTS is not configured; use the browser es-ES fallback." },
        { status: 503 },
      );
    }
    console.error("Unable to synthesize listening audio", error);
    return NextResponse.json({ error: "Listening audio could not be generated." }, { status: 503 });
  }
}
