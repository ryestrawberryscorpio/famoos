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

    const provider = (process.env.TTS_PROVIDER || "fish").toLowerCase();

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

    const apiKey = process.env.FISH_AUDIO_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing FISH_AUDIO_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const url = "https://api.fish.audio/v1/tts";
    // Start with a minimal payload to avoid upstream validation issues;
    // add optional fields only if provided.
    const payload: Record<string, unknown> = { text };
    if (format) payload.format = format;
    if (latency) payload.latency = latency;
    if (normalize !== undefined) payload.normalize = normalize;
    if (temperature !== undefined) payload.temperature = temperature;
    if (top_p !== undefined) payload.top_p = top_p;
    if (Array.isArray(references) && references.length > 0) payload.references = references;
    if (reference_id) payload.reference_id = reference_id;
    if (prosody) payload.prosody = prosody;
    if (chunk_length) payload.chunk_length = chunk_length;
    if (sample_rate) payload.sample_rate = sample_rate;
    if (mp3_bitrate) payload.mp3_bitrate = mp3_bitrate;
    if (opus_bitrate) payload.opus_bitrate = opus_bitrate;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return new Response(
        JSON.stringify({ error: `Fish Audio error: ${upstream.status} ${errText}` }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // The Fish API returns JSON (per user’s snippet). Normalize it.
    const data = await upstream.json();

    // Best-effort normalization to one of: url | audio (base64) | raw
    const urlOrAudio = {
      url: (data?.url || data?.audio_url || data?.data?.url) ?? undefined,
      audio: (data?.audio || data?.data?.audio) ?? undefined,
      contentType: data?.contentType || data?.mime || "audio/mpeg",
      raw: data,
      provider: "fish",
    };

    return new Response(JSON.stringify(urlOrAudio), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
