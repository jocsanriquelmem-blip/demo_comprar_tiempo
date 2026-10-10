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
  const { completeChallenge } = useWallet();
  const rewardText = "5 min x bonus";

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
