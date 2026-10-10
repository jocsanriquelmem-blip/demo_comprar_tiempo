"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  ChevronLeft,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  SwitchCamera,
} from "lucide-react";
import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { POSE_MODEL_URL, TARGET_SQUATS, WASM_ROOT } from "@/lib/constants";
import { SquatDetector } from "@/lib/squatDetector";

type CameraState = "idle" | "loading" | "ready" | "running" | "paused" | "error";
type CameraMode = "wide" | "selfie";
type ZoomCapabilities = MediaTrackCapabilities & {
  zoom?: {
    min?: number;
    max?: number;
    step?: number;
  };
};

const WIDE_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1080 },
  height: { ideal: 1920 },
  aspectRatio: { ideal: 9 / 16 },
};

const SELFIE_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "user" },
  width: { ideal: 1080 },
  height: { ideal: 1920 },
  aspectRatio: { ideal: 9 / 16 },
};

const POSE_CONNECTIONS = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 31],
  [24, 26],
  [26, 28],
  [28, 32],
] as const;

export function CameraPoseTracker({
  disabled,
  onComplete,
  onManualEntry,
  rewardText,
}: {
  disabled?: boolean;
  onComplete: () => void;
  onManualEntry: () => void;
  rewardText: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef(new SquatDetector());
  const lastInferRef = useRef(0);
  const completedRef = useRef(false);
  const loopRef = useRef<FrameRequestCallback | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState("Activa la cámara para comenzar");
  const [error, setError] = useState("");
  const [angle, setAngle] = useState<number | undefined>();
  const [cameraMode, setCameraMode] = useState<CameraMode>("wide");

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  const getCameraStream = useCallback(async () => {
    if (cameraMode === "selfie") {
      return navigator.mediaDevices.getUserMedia({
        video: SELFIE_VIDEO_CONSTRAINTS,
        audio: false,
      });
    }

    const firstStream = await navigator.mediaDevices.getUserMedia({
      video: WIDE_VIDEO_CONSTRAINTS,
      audio: false,
    });

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const preferred = findUltraWideCamera(cameras);

    if (!preferred) {
      return firstStream;
    }

    firstStream.getTracks().forEach((track) => track.stop());

    return navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: preferred.deviceId },
        width: { ideal: 1080 },
        height: { ideal: 1920 },
        aspectRatio: { ideal: 9 / 16 },
      },
      audio: false,
    });
  }, [cameraMode]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawLandmarks = useCallback(
    (landmarks: NormalizedLandmark[]) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const rect = getObjectContainRect(
        canvas.width,
        canvas.height,
        video.videoWidth || canvas.width,
        video.videoHeight || canvas.height,
      );

      const project = (point: NormalizedLandmark) => {
        const x = cameraMode === "selfie" ? 1 - point.x : point.x;
        return {
          x: rect.x + x * rect.width,
          y: rect.y + point.y * rect.height,
        };
      };

      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(52, 211, 153, 0.72)";

      for (const [from, to] of POSE_CONNECTIONS) {
        const start = landmarks[from];
        const end = landmarks[to];
        if (!isVisible(start) || !isVisible(end)) continue;

        const a = project(start);
        const b = project(end);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      ctx.fillStyle = "#34d399";
      ctx.strokeStyle = "rgba(2, 6, 23, 0.65)";
      ctx.lineWidth = 3;

      for (const point of landmarks) {
        if (!isVisible(point)) continue;
        const position = project(point);
        ctx.beginPath();
        ctx.arc(position.x, position.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

    },
    [cameraMode],
  );

  const runFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    const now = performance.now();

    if (
      video &&
      landmarker &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      now - lastInferRef.current > 120
    ) {
      lastInferRef.current = now;
      const result = landmarker.detectForVideo(video, now);
      const landmarks = result.landmarks[0];
      const detectorResult = detectorRef.current.update(landmarks, now);
      setStatus(detectorResult.message);
      setAngle(detectorResult.angle);
      setReps(detectorResult.reps);

      if (landmarks) {
        drawLandmarks(landmarks);
      } else {
        clearCanvas();
      }

      if (detectorResult.reps >= TARGET_SQUATS && !completedRef.current) {
        completedRef.current = true;
        stopCamera();
        onComplete();
        return;
      }
    }

    if (loopRef.current) {
      rafRef.current = requestAnimationFrame(loopRef.current);
    }
  }, [clearCanvas, drawLandmarks, onComplete, stopCamera]);

  useEffect(() => {
    loopRef.current = runFrame;
  }, [runFrame]);

  const activateCamera = useCallback(async () => {
    if (disabled) return;

    try {
      setError("");
      setCameraState("loading");
      setStatus("Cargando cámara y modelo");

      stopCamera();

      const stream = await getCameraStream();
      streamRef.current = stream;

      const [track] = stream.getVideoTracks();
      const capabilities = track?.getCapabilities?.() as ZoomCapabilities | undefined;
      if (cameraMode === "wide" && capabilities?.zoom?.min) {
        await track.applyConstraints({
          advanced: [{ zoom: capabilities.zoom.min } as MediaTrackConstraintSet],
        });
      }

      const video = videoRef.current;
      if (!video) throw new Error("No se pudo preparar la vista de cámara.");

      video.srcObject = stream;
      await video.play();

      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
      landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: POSE_MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      detectorRef.current.reset();
      completedRef.current = false;
      setReps(0);
      setStatus("Listo");
      setCameraState("ready");
    } catch (caught) {
      stopCamera();
      setCameraState("error");
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo iniciar la cámara o el modelo.",
      );
      setStatus("Usa Reintentar o continuar sin cámara");
    }
  }, [cameraMode, disabled, getCameraStream, stopCamera]);

  const start = useCallback(() => {
    if (cameraState !== "ready" && cameraState !== "paused") return;
    setCameraState("running");
    setStatus("Buscando cuerpo completo");
    if (loopRef.current) {
      rafRef.current = requestAnimationFrame(loopRef.current);
    }
  }, [cameraState]);

  const pause = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setCameraState("paused");
    setStatus("Pausado");
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  return (
    <section className="relative h-dvh min-h-svh overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`h-full w-full object-contain ${
            cameraMode === "selfie" ? "scale-x-[-1]" : ""
          }`}
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.64),rgba(15,23,42,0.05)_34%,rgba(15,23,42,0.62))]" />

      <div className="relative z-10 flex h-dvh min-h-svh flex-col justify-between px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="flex items-start justify-between gap-2">
          <Link
            href="/actividades"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-950/45 text-white backdrop-blur"
            aria-label="Volver"
          >
            <ChevronLeft aria-hidden size={22} />
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-slate-950/45 px-3 py-2 text-right backdrop-blur">
            <span className="text-xs font-black text-emerald-200">{rewardText}</span>
            <span className="size-1.5 rounded-full bg-white/45" />
            <span className="text-xs font-black text-white/70">
              {cameraMode === "wide" ? "Trasera" : "Selfie"}
            </span>
          </div>
        </header>

        <div className="pointer-events-none absolute left-1/2 top-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))] -translate-x-1/2">
          <div className="grid size-20 place-items-center rounded-full border border-white/15 bg-slate-950/45 text-center shadow-lg backdrop-blur">
            <p className="text-4xl font-black leading-none">
              {reps}
              <span className="text-base text-emerald-200">/{TARGET_SQUATS}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {error ? (
            <p className="rounded-2xl border border-rose-200/40 bg-rose-500/20 px-3 py-2 text-xs leading-5 text-rose-50 backdrop-blur">
              {error}
            </p>
          ) : null}

          <div className="flex items-end justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={activateCamera}
                disabled={
                  disabled || cameraState === "loading" || cameraState === "running"
                }
                className="grid size-13 place-items-center rounded-full bg-white text-slate-950 shadow-lg disabled:opacity-45"
                aria-label={cameraState === "error" ? "Reintentar" : "Activar cámara"}
                title={cameraState === "error" ? "Reintentar" : "Activar cámara"}
              >
                {cameraState === "error" ? (
                  <RotateCcw size={22} />
                ) : (
                  <Camera size={22} />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCameraState("idle");
                  setStatus("Activa la cámara para comenzar");
                  setCameraMode((current) =>
                    current === "wide" ? "selfie" : "wide",
                  );
                }}
                disabled={cameraState === "loading" || cameraState === "running"}
                className="grid size-13 place-items-center rounded-full bg-white/12 text-white shadow-lg backdrop-blur disabled:opacity-45"
                aria-label="Cambiar cámara"
                title="Cambiar cámara"
              >
                <SwitchCamera size={22} />
              </button>
              <button
                type="button"
                onClick={onManualEntry}
                disabled={disabled}
                className="grid size-13 place-items-center rounded-full bg-white/12 text-white shadow-lg backdrop-blur disabled:opacity-45"
                aria-label="Continuar sin cámara"
                title="Continuar sin cámara"
              >
                <Sparkles size={22} />
              </button>
            </div>
            {cameraState === "running" ? (
              <button
                type="button"
                onClick={pause}
                className="grid size-16 place-items-center rounded-full bg-amber-300 text-amber-950 shadow-xl"
                aria-label="Pausar"
                title="Pausar"
              >
                <Pause size={28} />
              </button>
            ) : (
              <button
                type="button"
                onClick={start}
                disabled={cameraState !== "ready" && cameraState !== "paused"}
                className="grid size-16 place-items-center rounded-full bg-emerald-300 text-emerald-950 shadow-xl disabled:opacity-45"
                aria-label="Iniciar"
                title="Iniciar"
              >
                <Play size={30} />
              </button>
            )}
          </div>
          <div className="mx-auto flex w-fit max-w-full items-center gap-2 rounded-full bg-slate-950/45 px-3 py-2 text-center text-xs font-black text-white/80 backdrop-blur">
            <span className="max-w-[14rem] truncate">{status}</span>
            {typeof angle === "number" ? (
              <>
                <span className="size-1 rounded-full bg-white/35" />
                <span>{Math.round(angle)}°</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function findUltraWideCamera(devices: MediaDeviceInfo[]) {
  const rearCameras = devices.filter((device) => {
    const label = device.label.toLowerCase();
    return (
      label &&
      !label.includes("front") &&
      !label.includes("selfie") &&
      !label.includes("facetime") &&
      !label.includes("frontal")
    );
  });

  return (
    rearCameras.find((device) => {
      const label = device.label.toLowerCase();
      return (
        label.includes("ultra") ||
        label.includes("0.5") ||
        label.includes("0,5") ||
        label.includes("gran angular") ||
        label.includes("ultrawide")
      );
    }) ?? rearCameras[0]
  );
}

function isVisible(point: NormalizedLandmark | undefined) {
  return Boolean(point && (point.visibility ?? 1) > 0.5);
}

function getObjectContainRect(
  containerWidth: number,
  containerHeight: number,
  mediaWidth: number,
  mediaHeight: number,
) {
  const containerRatio = containerWidth / containerHeight;
  const mediaRatio = mediaWidth / mediaHeight;

  if (mediaRatio > containerRatio) {
    const width = containerWidth;
    const height = width / mediaRatio;
    return {
      x: 0,
      y: (containerHeight - height) / 2,
      width,
      height,
    };
  }

  const height = containerHeight;
  const width = height * mediaRatio;
  return {
    x: (containerWidth - width) / 2,
    y: 0,
    width,
    height,
  };
}
