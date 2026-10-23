"use client";

import { OrbitControls, useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import { Vector3 } from "three";
import type { Dictionary } from "@/lib/i18n";
import { ModelScene } from "./ModelScene";
import { RoomScene } from "./RoomScene";

type Props = {
  dict: Dictionary["viewer"];
  /** Real SketchUp export, e.g. `/models/rumah-kubu.glb`. */
  modelUrl?: string | null;
  /** Renders the Kenney demo room instead of a real model. */
  demoScene?: boolean;
};

const DEMO_CAMERA: [number, number, number] = [5.1, 5, -6.1];
const DEMO_TARGET: [number, number, number] = [0, 0.85, 0];
const MODEL_CAMERA: [number, number, number] = [3.6, 2.6, 4.8];
const MODEL_TARGET: [number, number, number] = [0, 0.4, 0];

type ViewerErrorBoundaryProps = {
  title: string;
  body: string;
  children: ReactNode;
};

type ViewerErrorBoundaryState = { failed: boolean };

class ViewerErrorBoundary extends Component<
  ViewerErrorBoundaryProps,
  ViewerErrorBoundaryState
> {
  state: ViewerErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ViewerErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 grid place-items-center bg-carbone px-6 text-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-copper">
              {this.props.title}
            </p>
            <p className="mt-3 max-w-sm text-sm text-muted">{this.props.body}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function PortfolioViewer({ dict, modelUrl, demoScene = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { active, progress } = useProgress();

  const isDemo = !modelUrl && demoScene;
  const camera = isDemo ? DEMO_CAMERA : MODEL_CAMERA;
  const target = isDemo ? DEMO_TARGET : MODEL_TARGET;

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

  const reset = useCallback(() => {
    controlsRef.current?.reset();
  }, []);

  const rotate = useCallback((direction: 1 | -1) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const cameraObject = controls.object;
    const offset = cameraObject.position.clone().sub(controls.target);
    offset.applyAxisAngle(new Vector3(0, 1, 0), direction * (Math.PI / 12));
    cameraObject.position.copy(controls.target).add(offset);
    cameraObject.lookAt(controls.target);
    controls.update();
  }, []);

  const hintId = "viewer-hint";

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={dict.canvasLabel}
      aria-describedby={hintId}
      className={`relative isolate overflow-hidden border border-line bg-carbone ${
        isFullscreen ? "h-svh w-svw" : "aspect-[4/3] md:aspect-[16/9]"
      }`}
    >
      <ViewerErrorBoundary title={dict.errorTitle} body={dict.errorBody}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: camera, fov: 42, near: 0.1, far: 120 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          performance={{ min: 0.5 }}
        >
          <color attach="background" args={["#0d0f12"]} />

          <ambientLight intensity={0.32} />
          <hemisphereLight args={["#dfe6ee", "#1d2126", 0.45]} />
          <directionalLight
            position={[6, 9, 5]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-9}
            shadow-camera-right={9}
            shadow-camera-top={9}
            shadow-camera-bottom={-9}
            shadow-camera-near={0.5}
            shadow-camera-far={30}
            shadow-bias={-0.0005}
          />
          <pointLight
            position={[0, 2.8, 0]}
            intensity={6}
            distance={14}
            decay={2}
            color="#ffb27a"
          />

          <Suspense fallback={null}>
            {isDemo ? <RoomScene /> : null}
            {modelUrl ? <ModelScene url={modelUrl} /> : null}
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            makeDefault
            target={target}
            enablePan={false}
            enableZoom
            autoRotate
            autoRotateSpeed={0.65}
            minDistance={isDemo ? 4.5 : 2.2}
            maxDistance={isDemo ? 15 : 9}
            minPolarAngle={0.18}
            maxPolarAngle={Math.PI / 2 - 0.04}
          />
        </Canvas>
      </ViewerErrorBoundary>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <span className="border border-copper/50 bg-ink/80 px-2 py-1 font-mono text-[10px] tracking-[0.16em] text-copper backdrop-blur">
            {dict.badge}
          </span>
          {isDemo ? (
            <span className="hidden border border-line bg-ink/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted backdrop-blur sm:inline-block">
              {dict.demoBadge}
            </span>
          ) : null}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <ViewerButton label={dict.rotateLeft} onClick={() => rotate(-1)}>
            ↺
          </ViewerButton>
          <ViewerButton label={dict.rotateRight} onClick={() => rotate(1)}>
            ↻
          </ViewerButton>
          <ViewerButton label={dict.reset} onClick={reset}>
            ⟲
          </ViewerButton>
          <ViewerButton
            label={isFullscreen ? dict.exitFullscreen : dict.fullscreen}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? "⤡" : "⛶"}
          </ViewerButton>
        </div>
      </div>

      <p
        id={hintId}
        className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] border border-line/70 bg-ink/75 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted backdrop-blur sm:bottom-4 sm:left-4"
      >
        {dict.hint}
      </p>

      {isDemo ? (
        <p className="pointer-events-none absolute bottom-4 right-4 hidden max-w-[18rem] text-right font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted/70 md:block">
          {dict.demoNote}
        </p>
      ) : null}

      {active ? (
        <div className="absolute inset-0 grid place-items-center bg-ink/85">
          <div className="text-center">
            <div
              aria-hidden="true"
              className="mx-auto size-8 animate-spin rounded-full border border-line border-t-copper"
            />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              {dict.loading} {Math.round(progress)}%
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ViewerButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
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
