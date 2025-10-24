"use client";

import { useEffect, useRef, useState } from "react";
import { ThreeScene } from "@/components/ThreeScene";
import { Sidebar } from "@/components/Sidebar";
import { ChatBox } from "@/components/ChatBox";
import { AgentStatus } from "@/components/AgentStatus";

export default function Home() {
  const [talking, setTalking] = useState(false);
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [customColor, setCustomColor] = useState<string | undefined>(undefined);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | undefined>('/bg.png');
  const [animationCue, setAnimationCue] = useState<"dance" | "jump" | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const clearObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const handleRandomColor = () => {
    clearObjectUrl();
    setBackgroundImageUrl(undefined);
    const hex = `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")}`;
    setCustomColor(hex);
  };

  const handleColorPick = (hex: string) => {
    clearObjectUrl();
    setBackgroundImageUrl(undefined);
    setCustomColor(hex);
  };

  const handleImageUpload = (file: File | null) => {
    if (!file) return;
    clearObjectUrl();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setBackgroundImageUrl(url);
    setCustomColor(undefined);
  };

  const handleResetBackground = () => {
    clearObjectUrl();
    setBackgroundImageUrl('/bg.png');
    setCustomColor(undefined);
  };

  const handleAnimationCue = (cue: "dance" | "jump") => {
    setAnimationCue(cue);
  };

  const handleAnimationComplete = () => {
    setAnimationCue(null);
  };

  const handleCancelAnimation = () => {
    setAnimationCue(null);
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <ThreeScene
          talking={talking}
          bg="dark"
          customColor={customColor}
          backgroundImageUrl={backgroundImageUrl}
          animationCue={animationCue}
          onAnimationCueComplete={handleAnimationComplete}
        />
      </div>

      {/* Overlays */}
      <Sidebar
        lang={lang}
        setLang={setLang}
        onRandomColor={handleRandomColor}
        onColorPick={handleColorPick}
        onImageUpload={handleImageUpload}
        onResetDefault={handleResetBackground}
        currentColor={customColor}
      />
      <ChatBox lang={lang} onTalkingChange={setTalking} onAnimationCue={handleAnimationCue} onCancelAnimationCue={handleCancelAnimation} />
      <AgentStatus />

      {/* Branding */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-10 select-none">
        <span className="px-4 py-1 rounded-full bg-black/40 border border-white/20 text-white tracking-wide">Famo OS</span>
      </div>
    </div>
  );
}
