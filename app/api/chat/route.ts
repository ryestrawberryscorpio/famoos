import { NextRequest } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Provider = "openai" | "deepseek";

// Load persona XML once at module init
let personaContent: string | undefined;
try {
  const p = join(process.cwd(), "config", "persona.xml");
  if (existsSync(p)) {
    personaContent = readFileSync(p, "utf8");
  }
} catch {}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      model,
      temperature = 0.7,
      top_p = 1,
      system,
      lang,
    }: {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
      model?: string;
      temperature?: number;
      top_p?: number;
      system?: string;
      lang?: string;
    } = body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing 'messages' array in body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const envProvider = (process.env.LLM_PROVIDER || "openai").toLowerCase();
    const chosen: Provider = envProvider === "deepseek" ? "deepseek" : "openai";
    const apiKey =
      chosen === "openai"
        ? process.env.OPENAI_API_KEY
        : process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `Missing API key for ${chosen}` }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const url =
      chosen === "openai"
        ? "https://api.openai.com/v1/chat/completions"
        : "https://api.deepseek.com/chat/completions";

    // Default models if not provided
    const defaultModel = chosen === "openai" ? "gpt-4o-mini" : "deepseek-chat";

    const langSystem =
      lang === "zh"
        ? "请始终使用简体中文回答。"
        : "Always respond in clear, natural English.";

    const baseMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      ...(personaContent
        ? [{ role: "system" as const, content: `Personality definition XML follows. Obey strictly.\n${personaContent}` }]
        : []),
      { role: "system", content: langSystem },
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages,
    ];

    let payload: any;
    if (chosen === "deepseek") {
      payload = {
        model: model || defaultModel,
        messages: baseMessages,
        stream: false,
      } as any;
      if (typeof temperature === "number") payload.temperature = temperature;
      if (typeof top_p === "number") payload.top_p = top_p;
    } else {
      payload = {
        model: model || defaultModel,
        messages: baseMessages,
        temperature,
        top_p,
      } as any;
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(
        JSON.stringify({ error: `Upstream error: ${resp.status} ${errText}` }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = await resp.json();

    // Normalize response to { text }
    const text: string =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.delta?.content ??
      data?.choices?.[0]?.text ??
      "";

    return new Response(JSON.stringify({ text }), {
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
