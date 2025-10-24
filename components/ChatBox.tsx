"use client";

import { useEffect, useRef, useState } from "react";
import { FaMicrophone } from "react-icons/fa";

export function ChatBox({
  lang,
  onTalkingChange,
}: {
  lang: "en" | "zh";
  onTalkingChange: (talking: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  async function handleSend() {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      // 1) Chat completion
      const chatResp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          messages: [...messages, userMsg],
        }),
      });
      const chatData = await chatResp.json();
      const text: string = chatData?.text || "";
      if (text) {
        setMessages((m) => [...m, { role: "assistant", content: text }]);
      }

      // 2) TTS via Fish Audio with Web Speech fallback
      if (text) {
        try {
          const ttsResp = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, lang }),
          });

          if (!ttsResp.ok) throw new Error(`TTS HTTP ${ttsResp.status}`);

          const ttsData = await ttsResp.json();

          if (ttsData?.url) {
            await playAudio(ttsData.url);
          } else if (ttsData?.audio) {
            const b64 = ttsData.audio as string;
            const bin = atob(b64);
            const arr = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            const blob = new Blob([arr], { type: ttsData?.contentType || "audio/mpeg" });
            const url = URL.createObjectURL(blob);
            try {
              await playAudio(url);
            } finally {
              URL.revokeObjectURL(url);
            }
          } else {
            // fallback to Web Speech if structure unknown
            await speakWithWebSpeech(text);
          }
        } catch (e) {
          // Fallback: Web Speech API
          await speakWithWebSpeech(text);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function playAudio(url: string) {
    return new Promise<void>((resolve, reject) => {
      try {
        const audio = new Audio();
        audioRef.current = audio;
        audio.src = url;
        audio.onended = () => {
          onTalkingChange(false);
          resolve();
        };
        audio.onerror = (err) => {
          onTalkingChange(false);
          reject(err);
        };
        // Attempt play; may require user gesture (send click qualifies)
        const playResult = audio.play();
        if (playResult !== undefined) {
          playResult
            .then(() => {
              onTalkingChange(true);
            })
            .catch((err) => {
              onTalkingChange(false);
              reject(err);
            });
        } else {
          onTalkingChange(true);
        }
      } catch (err) {
        onTalkingChange(false);
        reject(err);
      }
    });
  }

  function speakWithWebSpeech(text: string) {
    return new Promise<void>((resolve) => {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (!synth) {
        onTalkingChange(false);
        return resolve();
      }
      onTalkingChange(true);
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === "zh" ? "zh-CN" : "en-US";
      utter.onend = () => {
        onTalkingChange(false);
        resolve();
      };
      utter.onerror = () => {
        onTalkingChange(false);
        resolve();
      };
      synth.speak(utter);
    });
  }

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute left-1/2 -translate-x-1/2 bottom-10 w-[min(90vw,720px)] pointer-events-auto">
        <div className="backdrop-blur bg-black/40 border border-white/20 rounded-xl p-3 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs opacity-70">
              {lang === "zh" ? "支持中文 / 切换在侧边栏" : "Chinese toggle on the left"}
            </span>
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20"
              title={lang === "zh" ? "显示/隐藏历史记录" : "Show/Hide chat history"}
            >
              {showHistory ? "🗂" : "🕘"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="glass-btn flex h-12 w-12 items-center justify-center text-white/80 hover:text-white"
              title={lang === "zh" ? "语音输入测试版" : "Microphone (coming soon)"}
              onClick={() => console.log("Microphone feature coming soon")}
            >
              <FaMicrophone className="h-4 w-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={lang === "zh" ? "问我任何问题…" : "Ask me anything…"}
              className="flex-1 bg-black/30 border border-white/20 rounded px-3 py-3 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="glass-btn px-4 py-3 disabled:opacity-50"
            >
              {loading ? (lang === "zh" ? "发送中…" : "Sending…") : (lang === "zh" ? "发送" : "Send")}
            </button>
          </div>
          {showHistory && messages.length > 0 && (
            <div className="mt-3 max-h-48 overflow-auto text-sm space-y-1">
              {messages.map((m, i) => (
                <div key={i} className="opacity-90">
                  <span className="opacity-60">{m.role === "user" ? (lang === "zh" ? "你" : "You") : "Famo"}:</span> {m.content}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
