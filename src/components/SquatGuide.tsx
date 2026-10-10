"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Camera, ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SquatGuide({
  title = "Mira el movimiento",
  eyebrow = "Sentadillas",
  frames,
  cues,
  rewardText,
  startLabel = "Empezar con cámara",
  skipLabel = "Continuar sin cámara",
  onStart,
  onSkipCamera,
}: {
  title?: string;
  eyebrow?: string;
  frames: readonly string[];
  cues: readonly string[];
  rewardText: string;
  startLabel?: string;
  skipLabel?: string;
  onStart: () => void;
  onSkipCamera: () => void;
}) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 520);

    return () => window.clearInterval(id);
  }, [frames.length]);

  return (
    <main className="min-h-dvh overflow-hidden bg-[#f6fbf8] text-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/actividades"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-slate-950 shadow-sm"
            aria-label="Volver"
          >
            <ChevronLeft aria-hidden size={22} />
          </Link>
          <div className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-900">
            {rewardText}
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-700">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-4xl font-black leading-tight">
              {title}
            </h1>
          </div>

          <div className="relative my-6 aspect-square overflow-hidden rounded-[36px] border border-emerald-300/40 bg-slate-950 shadow-xl shadow-emerald-100/70">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(52,211,153,0.28),transparent_38%),linear-gradient(180deg,#0f172a,#020617)]" />
            <div className="absolute inset-x-8 bottom-8 h-5 rounded-full bg-emerald-300/45 blur-lg" />
            {frames.map((src, index) => (
              <motion.div
                key={`${src}-${index}`}
                className="absolute inset-0 grid place-items-center"
                animate={{ opacity: frameIndex === index ? 1 : 0 }}
                transition={{ duration: 0 }}
              >
                <Image
                  src={src}
                  alt=""
                  width={512}
                  height={512}
                  priority={index === 0}
                  className="h-full w-full object-contain p-3 drop-shadow-[0_0_18px_rgba(187,247,208,0.45)]"
                />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {cues.map((cue) => (
              <div
                key={cue}
                className="rounded-2xl bg-white px-3 py-3 text-sm font-black shadow-sm"
              >
                {cue}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={onStart}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white shadow-lg"
          >
            <Camera aria-hidden size={20} />
            {startLabel}
          </button>
          <button
            type="button"
            onClick={onSkipCamera}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-950"
          >
            <Sparkles aria-hidden size={18} />
            {skipLabel}
          </button>
        </div>
      </div>
    </main>
  );
}
