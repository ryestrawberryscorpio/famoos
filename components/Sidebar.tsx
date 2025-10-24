"use client";

import { useRef, useState } from "react";
import { MdOutlineImagesearchRoller } from "react-icons/md";
import { BsTwitterX } from "react-icons/bs";
import { FaGithubAlt, FaTwitch } from "react-icons/fa";

export function Sidebar({
  lang,
  setLang,
  onRandomColor,
  onColorPick,
  onImageUpload,
  onResetDefault,
  currentColor,
}: {
  lang: "en" | "zh";
  setLang: (v: "en" | "zh") => void;
  onRandomColor: () => void;
  onColorPick: (hex: string) => void;
  onImageUpload: (file: File | null) => void;
  onResetDefault: () => void;
  currentColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-20">
      <button
        onClick={() => setLang(lang === "en" ? "zh" : "en")}
        className="glass-btn flex h-12 w-12 items-center justify-center text-xs font-medium"
        title="Toggle Chinese / English"
      >
        {lang === "en" ? "中文" : "EN"}
      </button>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="glass-btn flex h-12 w-12 items-center justify-center"
          title="Background options"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <MdOutlineImagesearchRoller className="h-5 w-5" />
        </button>
        {open && (
          <div className="absolute left-14 top-0 flex flex-col gap-2 rounded-xl border border-white/20 bg-black/80 px-4 py-3 backdrop-blur-md">
            <button
              onClick={() => {
                setOpen(false);
                onRandomColor();
              }}
              className="text-sm text-white/80 transition hover:text-white"
            >
              Random color
            </button>
            <button
              onClick={() => {
                if (colorInputRef.current) {
                  colorInputRef.current.value = currentColor ?? "#0a0a0a";
                  colorInputRef.current.click();
                }
              }}
              className="text-sm text-white/80 transition hover:text-white"
            >
              Pick color…
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-white/80 transition hover:text-white"
            >
              Upload image…
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onResetDefault();
              }}
              className="text-sm text-white/80 transition hover:text-white"
            >
              Default background
            </button>
          </div>
        )}
        <input
          ref={colorInputRef}
          type="color"
          className="sr-only"
          onChange={(e) => {
            onColorPick(e.target.value);
            setOpen(false);
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            onImageUpload(e.target.files?.[0] ?? null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setOpen(false);
          }}
        />
      </div>

      <a
        href="https://x.com/Famo_OS"
        target="_blank"
        rel="noreferrer"
        className="glass-btn flex h-12 w-12 items-center justify-center"
        title="Twitter / X"
        aria-label="Twitter / X"
      >
        <BsTwitterX className="h-5 w-5" />
      </a>
      <a
        href="https://github.com/ryestrawberryscorpio/famoos"
        target="_blank"
        rel="noreferrer"
        className="glass-btn flex h-12 w-12 items-center justify-center"
        title="GitHub"
        aria-label="GitHub"
      >
        <FaGithubAlt className="h-5 w-5" />
      </a>
      <a
        href="https://www.twitch.tv/osfamo"
        target="_blank"
        rel="noreferrer"
        className="glass-btn flex h-12 w-12 items-center justify-center"
        title="Twitch"
        aria-label="Twitch"
      >
        <FaTwitch className="h-5 w-5" />
      </a>
    </div>
  );
}
