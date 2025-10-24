"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { FoxModel } from "./fox/FoxModel";
import { Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export type SceneBackground = "dark" | "blue" | "purple" | "gray" | "black";

function BackgroundLayer({ bg, color, imageUrl }: { bg: SceneBackground; color?: string; imageUrl?: string }) {
  const { scene } = useThree();
  const loaderRef = useRef<THREE.TextureLoader | null>(null);
  useEffect(() => {
    const colorMap: Record<SceneBackground, string> = {
      dark: "#0a0a0a",
      black: "#000000",
      gray: "#1f2937",
      blue: "#0b1535",
      purple: "#1b1036",
    };
    let disposed = false;
    if (imageUrl) {
      if (!loaderRef.current) loaderRef.current = new THREE.TextureLoader();
      loaderRef.current.load(
        imageUrl,
        (tex) => {
          if (disposed) return;
          tex.colorSpace = THREE.SRGBColorSpace;
          scene.background = tex;
        },
        undefined,
        () => {
          if (disposed) return;
          scene.background = new THREE.Color(color ?? colorMap[bg]);
        },
      );
      return () => {
        disposed = true;
        const bg = scene.background as any;
        if (bg && bg.isTexture) bg.dispose?.();
      };
    }
    scene.background = new THREE.Color(color ?? colorMap[bg]);
  }, [bg, color, imageUrl, scene]);
  return null;
}

interface ThreeSceneProps {
  talking: boolean;
  bg: SceneBackground;
  customColor?: string;
  backgroundImageUrl?: string;
  animationCue?: "dance" | "jump" | null;
  onAnimationCueComplete?: () => void;
}

export function ThreeScene({
  talking,
  bg,
  customColor,
  backgroundImageUrl,
  animationCue,
  onAnimationCueComplete,
}: ThreeSceneProps) {
  return (
    <Canvas camera={{ position: [0, 1.4, 4], fov: 45 }}>
      <BackgroundLayer bg={bg} color={customColor} imageUrl={backgroundImageUrl} />
      <hemisphereLight args={[0xffffff, 0x404040, 0.6]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.3} />
      <Suspense fallback={null}>
        <FoxModel talking={talking} animationCue={animationCue} onAnimationCueComplete={onAnimationCueComplete} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls enableDamping enablePan={false} minDistance={2} maxDistance={8} target={[0, 1, 0]} />
    </Canvas>
  );
}
