"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CameraPoseTracker } from "@/components/CameraPoseTracker";
import { SquatGuide } from "@/components/SquatGuide";
import { useWallet } from "@/hooks/useWallet";
import { getExercise } from "@/lib/exercises";

export default function SquatsPage() {
  const router = useRouter();
  const { completeChallenge, stats } = useWallet();
  const [showCamera, setShowCamera] = useState(false);
  const exercise = getExercise("sentadillas");
  const reachedCap = stats.availableReward <= 0;

  const finish = (mode: "camera" | "manual") => {
    completeChallenge(mode, "sentadillas", exercise?.reps ?? 10);
    router.push("/recompensa");
  };

  const rewardText = reachedCap
    ? "Límite diario alcanzado"
    : `Hasta +${stats.availableReward} min virtuales`;

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
    <CameraPoseTracker
      disabled={reachedCap}
      onComplete={() => finish("camera")}
      onManualEntry={() => finish("manual")}
      rewardText={rewardText}
    />
  );
}
