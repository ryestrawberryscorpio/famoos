"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import * as THREE from "three";

interface FoxModelProps {
  talking: boolean;
  animationCue?: "dance" | "jump" | null;
  onAnimationCueComplete?: () => void;
}

export function FoxModel({ talking, animationCue, onAnimationCueComplete }: FoxModelProps) {
  const desiredHeight = 1.4; // target character height in world units
  const idleGltf = useGLTF("/idle.glb") as GLTF;
  const talkGltf = useGLTF("/talk.glb") as GLTF;
  const danceGltf = useGLTF("/dance.glb") as GLTF;
  const jumpGltf = useGLTF("/jump.glb") as GLTF;
  const idleScene = idleGltf?.scene as THREE.Object3D | undefined;
  const talkScene = talkGltf?.scene as THREE.Object3D | undefined;
  const danceScene = danceGltf?.scene as THREE.Object3D | undefined;
  const jumpScene = jumpGltf?.scene as THREE.Object3D | undefined;

  const idleGroupRef = useRef<THREE.Group>(null);
  const talkGroupRef = useRef<THREE.Group>(null);
  const danceGroupRef = useRef<THREE.Group>(null);
  const jumpGroupRef = useRef<THREE.Group>(null);
  const idleMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const talkMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const danceMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const jumpMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const talkActionRef = useRef<THREE.AnimationAction | null>(null);
  const danceActionRef = useRef<THREE.AnimationAction | null>(null);
  const jumpActionRef = useRef<THREE.AnimationAction | null>(null);
  const [ready, setReady] = useState(false);
  const [alphaIdle, setAlphaIdle] = useState(1);
  const [alphaTalk, setAlphaTalk] = useState(0);
  const [alphaDance, setAlphaDance] = useState(0);
  const [alphaJump, setAlphaJump] = useState(0);
  const blendDuration = 0.4; // seconds
  const fadeRaf = useRef<number | null>(null);

  // Patch materials and prepare animations when models load
  useLayoutEffect(() => {
    const patch = (root: THREE.Object3D | undefined) => {
      if (!root) return;
      root.traverse((obj: THREE.Object3D) => {
        obj.frustumCulled = false;
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            if (m) {
              m.side = THREE.DoubleSide;
              m.transparent = true;
              if (m.opacity === 0) m.opacity = 1;
            }
          });
        }
        obj.visible = true;
      });
    };
    patch(idleScene);
    patch(talkScene);
    patch(danceScene);
    patch(jumpScene);

    if (idleScene && !idleMixerRef.current) {
      idleMixerRef.current = new THREE.AnimationMixer(idleScene);
      const clip = (idleGltf?.animations?.[0] as THREE.AnimationClip | undefined);
      if (clip) {
        idleActionRef.current = idleMixerRef.current.clipAction(clip);
        idleActionRef.current.play();
        // Advance a tiny step to avoid T-pose flash
        idleActionRef.current.time = 0.016;
        idleMixerRef.current.update(0.016);
      }
    }
    if (talkScene && !talkMixerRef.current) {
      talkMixerRef.current = new THREE.AnimationMixer(talkScene);
      const clip = (talkGltf?.animations?.[0] as THREE.AnimationClip | undefined);
      if (clip) {
        talkActionRef.current = talkMixerRef.current.clipAction(clip);
        talkActionRef.current.setLoop(THREE.LoopRepeat, Infinity);
        // Don't play yet; start when talking toggles
        talkActionRef.current.paused = true;
      }
    }
    if (danceScene && !danceMixerRef.current) {
      danceMixerRef.current = new THREE.AnimationMixer(danceScene);
      const clip = (danceGltf?.animations?.[0] as THREE.AnimationClip | undefined);
      if (clip) {
        danceActionRef.current = danceMixerRef.current.clipAction(clip);
        danceActionRef.current.setLoop(THREE.LoopOnce, 1);
        danceActionRef.current.clampWhenFinished = true;
        danceActionRef.current.enabled = false;
        danceActionRef.current.paused = true;
      }
    }
    if (jumpScene && !jumpMixerRef.current) {
      jumpMixerRef.current = new THREE.AnimationMixer(jumpScene);
      const clip = (jumpGltf?.animations?.[0] as THREE.AnimationClip | undefined);
      if (clip) {
        jumpActionRef.current = jumpMixerRef.current.clipAction(clip);
        jumpActionRef.current.setLoop(THREE.LoopOnce, 1);
        jumpActionRef.current.clampWhenFinished = true;
        jumpActionRef.current.enabled = false;
        jumpActionRef.current.paused = true;
      }
    }
  }, [idleScene, talkScene, danceScene, jumpScene, idleGltf, talkGltf, danceGltf, jumpGltf]);

  // Update mixers every frame
  useEffect(() => {
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const d = clock.getDelta();
      idleMixerRef.current?.update(d);
      talkMixerRef.current?.update(d);
      danceMixerRef.current?.update(d);
      jumpMixerRef.current?.update(d);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Toggle animation with pre-warm and opacity fade between rigs
  useEffect(() => {
    if (animationCue) {
      if (fadeRaf.current) cancelAnimationFrame(fadeRaf.current);
      return;
    }

    const idleAct = idleActionRef.current;
    const talkAct = talkActionRef.current;
    // cancel any in flight fade
    if (fadeRaf.current) cancelAnimationFrame(fadeRaf.current);

    if (!talking) {
      if (talkAct) {
        talkAct.stop();
        talkAct.enabled = false;
        talkAct.paused = true;
      }
      if (danceActionRef.current) {
        danceActionRef.current.stop();
        danceActionRef.current.enabled = false;
        danceActionRef.current.paused = true;
      }
      if (jumpActionRef.current) {
        jumpActionRef.current.stop();
        jumpActionRef.current.enabled = false;
        jumpActionRef.current.paused = true;
      }
      if (alphaTalk !== 0) setAlphaTalk(0);
      if (alphaDance !== 0) setAlphaDance(0);
      if (alphaJump !== 0) setAlphaJump(0);
      if (alphaIdle !== 1) setAlphaIdle(1);
      if (idleAct) {
        idleAct.enabled = true;
        idleAct.paused = false;
        idleAct.play();
      }
      return;
    }

    if (talking) {
      setAlphaDance(0);
      setAlphaJump(0);
      danceActionRef.current?.stop();
      jumpActionRef.current?.stop();
      // Prepare talk before fade in
      if (talkAct && talkMixerRef.current) {
        try {
          talkAct.enabled = true;
          talkAct.reset();
          talkAct.play();
          talkAct.paused = false;
          talkMixerRef.current.update(0);
          talkAct.time = 0.016;
          talkMixerRef.current.update(0.016);
        } catch {}
      }
      // Keep idle running during fade out
      if (idleAct) {
        idleAct.enabled = true;
        idleAct.paused = false;
      }

      let start: number | null = null;
      const fromIdle = alphaIdle;
      const fromTalk = alphaTalk;
      const step = (t: number) => {
        if (start === null) start = t;
        const p = Math.min(1, (t - start) / (blendDuration * 1000));
        setAlphaIdle(fromIdle + (0 - fromIdle) * p);
        setAlphaTalk(fromTalk + (1 - fromTalk) * p);
        if (p < 1) {
          fadeRaf.current = requestAnimationFrame(step);
        } else if (idleAct) {
          idleAct.paused = true;
          idleAct.enabled = false;
        }
      };
      fadeRaf.current = requestAnimationFrame(step);
    } else {
      setAlphaTalk(0);
      // Prepare idle before fade in
      if (idleAct && idleMixerRef.current) {
        try {
          idleAct.enabled = true;
          idleAct.reset();
          idleAct.paused = false;
          idleMixerRef.current.update(0);
          idleAct.time = 0.016;
          idleMixerRef.current.update(0.016);
        } catch {}
      }
      // Keep talk running during fade out
      if (talkAct) {
        talkAct.enabled = true;
        talkAct.paused = false;
      }

      let start: number | null = null;
      const fromIdle = alphaIdle;
      const fromTalk = alphaTalk;
      const step = (t: number) => {
        if (start === null) start = t;
        const p = Math.min(1, (t - start) / (blendDuration * 1000));
        setAlphaIdle(fromIdle + (1 - fromIdle) * p);
        setAlphaTalk(fromTalk + (0 - fromTalk) * p);
        if (p < 1) {
          fadeRaf.current = requestAnimationFrame(step);
        } else if (talkAct) {
          talkAct.paused = true;
          talkAct.enabled = false;
        }
      };
      fadeRaf.current = requestAnimationFrame(step);
    }
  }, [talking, animationCue, alphaIdle, alphaTalk, alphaDance, alphaJump]);

  // Handle one-shot cues such as dance or jump
  useEffect(() => {
    if (!animationCue) return;

    const isDance = animationCue === "dance";
    const actionRef = isDance ? danceActionRef.current : jumpActionRef.current;
    const mixer = isDance ? danceMixerRef.current : jumpMixerRef.current;

    if (!actionRef || !mixer) return;

    // Stop other animations
    if (talkActionRef.current) {
      talkActionRef.current.stop();
      talkActionRef.current.enabled = false;
      talkActionRef.current.paused = true;
    }
    setAlphaTalk(0);

    if (isDance) {
      if (jumpActionRef.current) {
        jumpActionRef.current.stop();
        jumpActionRef.current.enabled = false;
        jumpActionRef.current.paused = true;
      }
      setAlphaJump(0);
    } else {
      if (danceActionRef.current) {
        danceActionRef.current.stop();
        danceActionRef.current.enabled = false;
        danceActionRef.current.paused = true;
      }
      setAlphaDance(0);
    }

    setAlphaIdle(0);
    setAlphaDance(isDance ? 1 : 0);
    setAlphaJump(isDance ? 0 : 1);

    actionRef.enabled = true;
    actionRef.reset();
    actionRef.paused = false;
    actionRef.play();

    const handleFinished = (_event: THREE.Event) => {
      setAlphaDance(0);
      setAlphaJump(0);
      setAlphaTalk(0);
      setAlphaIdle(1);
      actionRef.stop();
      actionRef.enabled = false;
      actionRef.paused = true;
      if (idleActionRef.current) {
        idleActionRef.current.reset();
        idleActionRef.current.enabled = true;
        idleActionRef.current.paused = false;
        idleActionRef.current.play();
      }
      mixer.removeEventListener("finished", handleFinished);
      onAnimationCueComplete?.();
    };

    mixer.removeEventListener("finished", handleFinished);
    mixer.addEventListener("finished", handleFinished);

    return () => {
      mixer.removeEventListener("finished", handleFinished);
    };
  }, [animationCue, onAnimationCueComplete]);

  // Apply alpha to materials
  useEffect(() => {
    const setOpacity = (root: THREE.Object3D | null, val: number) => {
      if (!root) return;
      root.traverse((obj: THREE.Object3D) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            if (!m) continue;
            m.transparent = true;
            m.opacity = val;
            m.depthWrite = val >= 0.99; // reduce sorting artifacts during fade
            m.needsUpdate = true;
          }
        }
      });
    };
    setOpacity(idleGroupRef.current, ready ? alphaIdle : 0);
    setOpacity(talkGroupRef.current, ready ? alphaTalk : 0);
    setOpacity(danceGroupRef.current, ready ? alphaDance : 0);
    setOpacity(jumpGroupRef.current, ready ? alphaJump : 0);
  }, [alphaIdle, alphaTalk, alphaDance, alphaJump, ready]);

  // Scale to consistent height and align both models: bottom on grid, centered in X/Z
  useLayoutEffect(() => {
    try {
      const target = idleScene || talkScene;
      if (!target) return;

      // Height/center estimation: prefer skeleton bones (more reliable for skinned meshes),
      // otherwise fall back to geometry world AABB.
      const computeWorldAABB = (root: THREE.Object3D) => {
        const worldBox = new THREE.Box3();
        const tmp = new THREE.Box3();
        const mat = new THREE.Matrix4();
        root.updateWorldMatrix(true, true);
        root.traverse((node: THREE.Object3D) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
            const bb = mesh.geometry.boundingBox as THREE.Box3 | null;
            if (bb) {
              tmp.copy(bb);
              mat.copy(mesh.matrixWorld);
              tmp.applyMatrix4(mat);
              worldBox.union(tmp);
            }
          }
        });
        return worldBox;
      };

      const computeSkeletonExtents = (root: THREE.Object3D) => {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        let count = 0;
        root.updateWorldMatrix(true, true);
        root.traverse((node: THREE.Object3D) => {
          if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
            const skinned = node as THREE.SkinnedMesh;
            const bones = skinned.skeleton.bones as THREE.Bone[];
            for (const b of bones) {
              const p = new THREE.Vector3();
              b.getWorldPosition(p);
              minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
              minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
              minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
              count++;
            }
          }
        });
        if (count === 0) return null;
        return {
          min: new THREE.Vector3(minX, minY, minZ),
          max: new THREE.Vector3(maxX, maxY, maxZ),
        };
      };

      const sk = computeSkeletonExtents(target);
      let s = 1;
      if (sk) {
        const height = Math.max(0.000001, sk.max.y - sk.min.y);
        s = desiredHeight / height;
      } else {
        const srcBox = computeWorldAABB(target);
        if (!srcBox.isEmpty()) {
          const height = Math.max(0.000001, srcBox.max.y - srcBox.min.y);
          s = desiredHeight / height;
        }
      }
      if (idleGroupRef.current) idleGroupRef.current.scale.setScalar(s);
      if (talkGroupRef.current) talkGroupRef.current.scale.setScalar(s);
      if (danceGroupRef.current) danceGroupRef.current.scale.setScalar(s);
      if (jumpGroupRef.current) jumpGroupRef.current.scale.setScalar(s);

      // Next frame, compute bounds of each GROUP (post-scale) and align to grid and center X/Z.
      // Also do a second pass to correct the height exactly to desiredHeight in world space.
      requestAnimationFrame(() => {
        const align = (group: THREE.Group | null) => {
          if (!group) return;
          // Use skeleton extents if available for centering and grounding
          const sk2 = computeSkeletonExtents(group);
          if (sk2) {
            const centerX = (sk2.max.x + sk2.min.x) / 2;
            const centerZ = (sk2.max.z + sk2.min.z) / 2;
            group.position.x += -centerX;
            group.position.z += -centerZ;
            group.position.y += -sk2.min.y;

            const h = Math.max(0.000001, sk2.max.y - sk2.min.y);
            const adjust = desiredHeight / h;
            if (Math.abs(adjust - 1) > 0.01) {
              group.scale.multiplyScalar(adjust);
              const sk3 = computeSkeletonExtents(group);
              if (sk3) {
                const centerX2 = (sk3.max.x + sk3.min.x) / 2;
                const centerZ2 = (sk3.max.z + sk3.min.z) / 2;
                group.position.x += -centerX2;
                group.position.z += -centerZ2;
                group.position.y += -sk3.min.y;
              }
            }
          } else {
            // Fallback to geometry AABB
            let box = computeWorldAABB(group);
            if (!box.isEmpty()) {
              const centerX = (box.max.x + box.min.x) / 2;
              const centerZ = (box.max.z + box.min.z) / 2;
              const minY = box.min.y;
              group.position.x += -centerX;
              group.position.z += -centerZ;
              group.position.y += -minY;

              box = computeWorldAABB(group);
              const h = Math.max(0.000001, box.max.y - box.min.y);
              const adjust = desiredHeight / h;
              if (Math.abs(adjust - 1) > 0.01) {
                group.scale.multiplyScalar(adjust);
                box = computeWorldAABB(group);
                const centerX2 = (box.max.x + box.min.x) / 2;
                const centerZ2 = (box.max.z + box.min.z) / 2;
                const minY2 = box.min.y;
                group.position.x += -centerX2;
                group.position.z += -centerZ2;
                group.position.y += -minY2;
              }
            }
          }
        };
        align(idleGroupRef.current);
        align(talkGroupRef.current);
        align(danceGroupRef.current);
        align(jumpGroupRef.current);
        setReady(true);
      });
    } catch {}
  }, [idleScene, talkScene]);

  return (
    <group>
      <group ref={idleGroupRef} visible={ready && alphaIdle > 0.02}>
        {idleScene ? <primitive object={idleScene} /> : null}
      </group>
      <group ref={talkGroupRef} visible={ready && alphaTalk > 0.02}>
        {talkScene ? <primitive object={talkScene} /> : null}
      </group>
      <group ref={danceGroupRef} visible={ready && alphaDance > 0.02}>
        {danceScene ? <primitive object={danceScene} /> : null}
      </group>
      <group ref={jumpGroupRef} visible={ready && alphaJump > 0.02}>
        {jumpScene ? <primitive object={jumpScene} /> : null}
      </group>
    </group>
  );
}
