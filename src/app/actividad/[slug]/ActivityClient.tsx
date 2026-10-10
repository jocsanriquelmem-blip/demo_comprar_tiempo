"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CameraPoseTracker } from "@/components/CameraPoseTracker";
import { SquatGuide } from "@/components/SquatGuide";
import { useWallet } from "@/hooks/useWallet";
import type { ExerciseSlug } from "@/lib/exercises";
import type { ChallengeMode } from "@/types";

type ActivityClientExercise = {
  slug: ExerciseSlug;
  title: string;
  reps: number;
  frames: readonly string[];
  cueLabels: readonly string[];
};

export function ActivityClient({ exercise }: { exercise: ActivityClientExercise }) {
  const router = useRouter();
  const { completeChallenge } = useWallet();
  const [showCamera, setShowCamera] = useState(false);
  const [completedMode, setCompletedMode] = useState<ChallengeMode | null>(null);
  const rewardText = "5 min x bonus";

  const complete = useCallback((mode: ChallengeMode) => {
    if (completedMode) return;

    completeChallenge(mode, exercise.slug, exercise.reps);
    setCompletedMode(mode);
  }, [completeChallenge, completedMode, exercise.reps, exercise.slug]);

  useEffect(() => {
    if (!completedMode) return;

    const timer = window.setTimeout(() => {
      router.push("/recompensa");
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [completedMode, router]);

  if (exercise.slug === "flexiones" && showCamera) {
    return (
      <>
        <CameraPoseTracker
          disabled={Boolean(completedMode)}
          exercise="pushups"
          targetReps={exercise.reps}
          onComplete={() => complete("camera")}
          onManualEntry={() => complete("manual")}
          rewardText={rewardText}
        />
        {completedMode ? (
          <ActivityCompleteAnimation reps={exercise.reps} />
        ) : null}
      </>
    );
  }

  return (
    <SquatGuide
      eyebrow={exercise.title}
      title="Mira el movimiento"
      frames={exercise.frames}
      cues={exercise.cueLabels}
      rewardText={rewardText}
      startLabel={exercise.slug === "flexiones" ? "Activar cámara" : "Completar desafío"}
      skipLabel={exercise.slug === "flexiones" ? "Continuar sin cámara" : "Ir a recompensa"}
      onStart={
        exercise.slug === "flexiones" ? () => setShowCamera(true) : () => complete("manual")
      }
      onSkipCamera={() => complete("manual")}
    />
  );
}

function ActivityCompleteAnimation({ reps }: { reps: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/82 px-6 text-center text-white backdrop-blur-md"
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0.84, y: 20 }}
        animate={reduceMotion ? undefined : { scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="space-y-4"
      >
        <p className="text-7xl font-black leading-none">{reps}/{reps}</p>
        <div>
          <p className="text-4xl font-black">¡Muy bien!</p>
          <p className="mt-2 text-lg font-bold text-emerald-100">
            Vamos por tu bonus
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
