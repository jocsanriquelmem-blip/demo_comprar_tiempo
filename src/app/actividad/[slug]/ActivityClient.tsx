"use client";

import { useRouter } from "next/navigation";
import { SquatGuide } from "@/components/SquatGuide";
import { useWallet } from "@/hooks/useWallet";
import type { ExerciseSlug } from "@/lib/exercises";

type ActivityClientExercise = {
  slug: ExerciseSlug;
  title: string;
  reps: number;
  frames: readonly string[];
  cueLabels: readonly string[];
};

export function ActivityClient({ exercise }: { exercise: ActivityClientExercise }) {
  const router = useRouter();
  const { completeChallenge, stats } = useWallet();
  const reachedCap = stats.availableReward <= 0;
  const rewardText = reachedCap
    ? "Límite diario alcanzado"
    : `Hasta +${stats.availableReward} min virtuales`;

  const complete = () => {
    completeChallenge("manual", exercise.slug, exercise.reps);
    router.push("/recompensa");
  };

  return (
    <SquatGuide
      eyebrow={exercise.title}
      title="Mira el movimiento"
      frames={exercise.frames}
      cues={exercise.cueLabels}
      rewardText={rewardText}
      startLabel="Completar desafío"
      skipLabel="Ir a recompensa"
      onStart={complete}
      onSkipCamera={complete}
    />
  );
}
