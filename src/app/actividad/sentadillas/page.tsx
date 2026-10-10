"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CameraPoseTracker } from "@/components/CameraPoseTracker";
import { SquatGuide } from "@/components/SquatGuide";
import { useWallet } from "@/hooks/useWallet";
import { getExercise } from "@/lib/exercises";
import type { ChallengeMode } from "@/types";

export default function SquatsPage() {
  const router = useRouter();
  const { completeChallenge } = useWallet();
  const [showCamera, setShowCamera] = useState(false);
  const [completedMode, setCompletedMode] = useState<ChallengeMode | null>(null);
  const exercise = getExercise("sentadillas");

  const finish = useCallback((mode: ChallengeMode) => {
    if (completedMode) return;

    completeChallenge(mode, "sentadillas", exercise?.reps ?? 10);
    setCompletedMode(mode);
  }, [completeChallenge, completedMode, exercise?.reps]);

  useEffect(() => {
    if (!completedMode) return;

    const timer = window.setTimeout(() => {
      router.push("/recompensa");
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [completedMode, router]);

  const rewardText = "5 min x bonus";

  if (!showCamera) {
    return (
      <SquatGuide
        eyebrow={exercise?.title ?? "Sentadillas"}
        title="Mira el movimiento"
        frames={exercise?.frames ?? []}
        cues={exercise?.cueLabels ?? []}
        rewardText={rewardText}
        onStart={() => setShowCamera(true)}
        onSkipCamera={() => finish("manual")}
      />
    );
  }

  return (
    <>
      <CameraPoseTracker
        disabled={Boolean(completedMode)}
        onComplete={() => finish("camera")}
        onManualEntry={() => finish("manual")}
        rewardText={rewardText}
      />
      {completedMode ? <SquatCompleteAnimation /> : null}
    </>
  );
}

function SquatCompleteAnimation() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/82 px-6 text-center text-white backdrop-blur-md"
    >
      {!reduceMotion
        ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
            <motion.span
              key={item}
              aria-hidden
              initial={{ opacity: 0, y: 80, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -180, scale: [0.5, 1.35, 1] }}
              transition={{ delay: item * 0.07, duration: 1.25 }}
              className="absolute bottom-1/3 size-4 rounded-full"
              style={{
                left: `${8 + item * 9}%`,
                backgroundColor: ["#34d399", "#facc15", "#60a5fa", "#fb7185"][
                  item % 4
                ],
              }}
            />
          ))
        : null}

      <motion.div
        initial={reduceMotion ? false : { scale: 0.84, y: 20 }}
        animate={reduceMotion ? undefined : { scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="space-y-4"
      >
        <p className="text-7xl font-black leading-none">10/10</p>
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
