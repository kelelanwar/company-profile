"use client";

import { useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PerspectiveCamera,
  SphereGeometry,
  SRGBColorSpace,
  type Texture,
} from "three";
import type { Dictionary } from "@/lib/i18n";
import { ViewerErrorBoundary } from "./ViewerErrorBoundary";

type Props = {
  /** 2:1 equirectangular photo, e.g. `/images/panoramas/loft-360.jpg`. */
  image: string;
  label: string;
  credit?: string;
  dict: Dictionary["viewer"];
};

type LookApi = {
  reset: () => void;
  turn: (radians: number) => void;
};

const DEFAULT_FOV = 75;
const MIN_FOV = 35;
const MAX_FOV = 95;
const MAX_LAT = Math.PI / 2 - 0.04;

/** Equirectangular photo sphere with drag-to-look, pinch/wheel zoom and slow auto-rotate. */
export function PanoramaViewer({ image, label, credit, dict }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lookRef = useRef<LookApi | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const element = containerRef.current;
    if (!element) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await element.requestFullscreen();
      }
    } catch {
      // Fullscreen can be blocked by the browser; the viewer keeps working inline.
    }
  }, []);

  const hintId = "panorama-hint";

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={label}
      aria-describedby={hintId}
      data-viewer="panorama"
      className={`relative isolate overflow-hidden border border-line bg-carbone ${
        isFullscreen ? "h-svh w-svw" : "aspect-[4/3] md:aspect-[16/9]"
      }`}
    >
      <ViewerErrorBoundary title={dict.errorTitle} body={dict.errorBody}>
        <Canvas
          dpr={[1, 2]}
          camera={{
            position: [0, 0, 0.01],
            fov: DEFAULT_FOV,
            near: 0.01,
            far: 120,
          }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <Suspense fallback={null}>
            <PanoramaSphere image={image} />
          </Suspense>
          <LookControls apiRef={lookRef} targetRef={containerRef} />
        </Canvas>
      </ViewerErrorBoundary>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <span className="border border-copper/50 bg-ink/80 px-2 py-1 font-mono text-[10px] tracking-[0.16em] text-copper backdrop-blur">
            {dict.badge}
          </span>
          <span className="hidden border border-line bg-ink/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted backdrop-blur sm:inline-block">
            {dict.panoramaBadge}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <PanoramaButton
            label={dict.lookLeft}
            onClick={() => lookRef.current?.turn(Math.PI / 8)}
          >
            ↺
          </PanoramaButton>
          <PanoramaButton
            label={dict.lookRight}
            onClick={() => lookRef.current?.turn(-Math.PI / 8)}
          >
            ↻
          </PanoramaButton>
          <PanoramaButton label={dict.reset} onClick={() => lookRef.current?.reset()}>
            ⟲
          </PanoramaButton>
          <PanoramaButton
            label={isFullscreen ? dict.exitFullscreen : dict.fullscreen}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? "⤡" : "⛶"}
          </PanoramaButton>
        </div>
      </div>

      <p
        id={hintId}
        className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] border border-line/70 bg-ink/75 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted backdrop-blur sm:bottom-4 sm:left-4"
      >
        {dict.panoramaHint}
      </p>

      {credit ? (
        <p className="pointer-events-none absolute bottom-4 right-4 hidden font-mono text-[9px] uppercase tracking-[0.14em] text-bone/45 md:block">
          {credit}
        </p>
      ) : null}
    </div>
  );
}

function prepareTexture(texture: Texture) {
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
}

function PanoramaSphere({ image }: { image: string }) {
  const texture = useTexture(image) as Texture;

  // Invert the geometry itself (not the mesh scale) so the inside of the
  // sphere is visible with correct, non-mirrored UVs.
  const geometry = useMemo(() => {
    const sphere = new SphereGeometry(50, 64, 40);
    sphere.scale(-1, 1, 1);
    return sphere;
  }, []);

  useEffect(() => {
    prepareTexture(texture);
  }, [texture]);

  useEffect(() => {
    return () => {
      texture.dispose();
      useTexture.clear(image);
      geometry.dispose();
    };
  }, [texture, image, geometry]);

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function LookControls({
  apiRef,
  targetRef,
}: {
  apiRef: React.MutableRefObject<LookApi | null>;
  targetRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { camera } = useThree();
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const lon = useRef(0);
  const lat = useRef(0);
  const fov = useRef(DEFAULT_FOV);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const allowAuto = useRef(true);
  const autoRotate = useRef(true);

  const apply = useCallback(() => {
    const activeCamera = cameraRef.current;
    if (!activeCamera) return;

    activeCamera.rotation.y = lon.current;
    activeCamera.rotation.x = lat.current;
    activeCamera.fov = fov.current;
    activeCamera.updateProjectionMatrix();
  }, []);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;

    cameraRef.current = camera;
    const activeCamera = cameraRef.current;
    activeCamera.rotation.order = "YXZ";
    apply();
  }, [camera, apply]);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    allowAuto.current = !reduced;
    autoRotate.current = !reduced;
  }, []);

  useEffect(() => {
    apiRef.current = {
      reset: () => {
        lon.current = 0;
        lat.current = 0;
        fov.current = DEFAULT_FOV;
        autoRotate.current = allowAuto.current;
        apply();
      },
      turn: (radians: number) => {
        lon.current += radians;
        autoRotate.current = false;
        apply();
      },
    };
  }, [apiRef, apply]);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    element.style.cursor = "grab";
    element.style.touchAction = "none";

    const distance = () => {
      const [a, b] = Array.from(pointers.current.values());
      if (!a || !b) return 0;
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));

    const onPointerDown = (event: PointerEvent) => {
      // Let overlay buttons handle their own clicks instead of starting a drag.
      if (event.target instanceof Element && event.target.closest("button")) {
        return;
      }

      element.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.current.size === 2) pinch.current = distance();
      autoRotate.current = false;
      element.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent) => {
      const previous = pointers.current.get(event.pointerId);
      if (!previous) return;

      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.current.size >= 2) {
        const current = distance();
        if (pinch.current > 0) {
          fov.current = clamp(fov.current - (current - pinch.current) * 0.08, MIN_FOV, MAX_FOV);
          apply();
        }
        pinch.current = current;
        return;
      }

      const scale = (fov.current / DEFAULT_FOV) * 0.0028;
      lon.current -= (event.clientX - previous.x) * scale;
      lat.current = clamp(lat.current - (event.clientY - previous.y) * scale, -MAX_LAT, MAX_LAT);
      apply();
    };

    const onPointerUp = (event: PointerEvent) => {
      pointers.current.delete(event.pointerId);
      if (pointers.current.size < 2) pinch.current = 0;
      if (pointers.current.size === 0) element.style.cursor = "grab";
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      fov.current = clamp(fov.current + event.deltaY * 0.05, MIN_FOV, MAX_FOV);
      apply();
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
    element.addEventListener("pointerleave", onPointerUp);
    element.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
      element.removeEventListener("pointerleave", onPointerUp);
      element.removeEventListener("wheel", onWheel);
    };
  }, [apply, targetRef]);

  useFrame((_, delta) => {
    const activeCamera = cameraRef.current;
    if (!activeCamera || !autoRotate.current) return;

    lon.current -= delta * 0.035;
    activeCamera.rotation.y = lon.current;
  });

  return null;
}

function PanoramaButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-8 place-items-center border border-line bg-ink/80 font-mono text-sm text-bone backdrop-blur transition-colors hover:border-copper hover:text-copper-hi sm:size-9"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
