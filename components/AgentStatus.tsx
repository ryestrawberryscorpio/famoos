"use client";

import { useState } from "react";
import { JetBrains_Mono } from "next/font/google";

const codeFont = JetBrains_Mono({ subsets: ["latin"], weight: "400" });

const liveStats = [
  { label: "Agent core", value: "Online", accent: "bg-emerald-400" },
  { label: "Training loop", value: "Meme synthesis", accent: "bg-cyan-400" },
  { label: "Market link", value: "Alpha test", accent: "bg-amber-400" },
];

const upcoming = [
  "Realtime bundled coin detection feed",
  "AI moon pattern heatmaps",
  "Self-serve coin launchpad with compliance guard",
  "On-chain rumor radar for four.meme",
  "Quant copilots for CZ watchlist",
];

export function AgentStatus() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`fixed top-6 right-6 z-30 flex flex-col items-end gap-3 ${codeFont.className}`}>
      {open && (
        <div className="relative w-72 overflow-hidden rounded-2xl border border-emerald-400/40 bg-black/85 px-4 pb-5 pt-6 text-white shadow-[0_0_40px_rgba(34,197,94,0.35)] backdrop-blur-xl transition-transform">
          <div className="absolute -top-16 -right-20 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
          <div className="absolute inset-0 border border-emerald-300/30 [mask-image:radial-gradient(circle_at_center,transparent_40%,black)] animate-spin-slow" aria-hidden="true" />

          <header className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] text-emerald-300">Famo Agent Status</p>
              <h3 className="text-base font-semibold text-white">Alpha build loop</h3>
            </div>
            <span className="text-[10px] text-emerald-200/70">v0.3 devnet</span>
          </header>

          <section className="mb-4 space-y-2">
            {liveStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between rounded-lg border border-emerald-400/20 bg-white/5/5 px-3 py-2 text-xs">
                <span className="text-emerald-200/80">{stat.label}</span>
                <span className="flex items-center gap-2 font-medium text-emerald-100">
                  {stat.value}
                  <span className={`h-1.5 w-1.5 rounded-full ${stat.accent} animate-pulse-fast`} />
                </span>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-emerald-300">Upcoming boosts</p>
            <ul className="space-y-1 text-xs text-emerald-100/80">
              {upcoming.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-5 rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-300 animate-gradient-bar" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="group relative glass-btn flex items-center gap-2 rounded-full border border-emerald-400/60 px-3 py-1.5 text-xs font-medium text-emerald-100"
        aria-expanded={open}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        {open ? "Collapse agent telemetry" : "Open agent telemetry"}
      </button>
    </div>
  );
}
