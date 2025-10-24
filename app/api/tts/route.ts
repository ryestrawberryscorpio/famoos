import { NextRequest } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      lang,
      temperature = 0.7,
      top_p = 0.7,
      references = [],
      reference_id,
      prosody = { speed: 1, volume: 0 },
      chunk_length = 200,
      normalize = true,
      format = "mp3",
      sample_rate = 24000,
      mp3_bitrate = 128,
      opus_bitrate = 32,
      latency = "normal",
    } = body || {};

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'text' in body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Force Murf provider per request; remove Fish fallback
    const provider = "murf";

    if (provider === "murf") {
      const murfKey = process.env.MURF_API_KEY;
      if (!murfKey) {
        return new Response(
          JSON.stringify({ error: "Missing MURF_API_KEY" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      const voiceId = process.env.MURF_VOICE_ID || "en-UK-ruby";
      const murfPayload = {
        text,
        voiceId,
        multiNativeLocale: lang === "zh" ? "zh-CN" : "en-US",
      } satisfies Record<string, unknown>;

      const murfResp = await fetch("https://api.murf.ai/v1/speech/generate", {
        method: "POST",
        headers: {
          "api-key": murfKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(murfPayload),
      });

      if (!murfResp.ok) {
        const errText = await murfResp.text();
        return new Response(
          JSON.stringify({ error: `Murf error: ${murfResp.status} ${errText}` }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      const contentType = murfResp.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const murfData = await murfResp.json();
        const audioUrl =
          murfData?.audioFileUrl ||
          murfData?.audioUrl ||
          murfData?.audioFile ||
          murfData?.data?.url ||
          murfData?.url;

        if (!audioUrl) {
          return new Response(
            JSON.stringify({ error: "Murf response missing audio URL" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({ url: audioUrl, provider: "murf", raw: murfData }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      const murfBuffer = Buffer.from(await murfResp.arrayBuffer());
      return new Response(
        JSON.stringify({
          audio: murfBuffer.toString("base64"),
          contentType: contentType || "audio/mpeg",
          provider: "murf",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      usage: "POST /api/tts with { text: string }",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
