"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell, Notice } from "@/components/AppShell";
import { RewardCelebration } from "@/components/RewardCelebration";
import { useWallet } from "@/hooks/useWallet";
import {
  FIXED_REWARD_MIN,
  REWARD_MULTIPLIERS,
  TARGET_SQUATS,
} from "@/lib/constants";
import { getExerciseLabel } from "@/lib/exercises";
import type { RewardMultiplier } from "@/types";

export default function RewardPage() {
  const router = useRouter();
  const { wallet, isLoaded, creditPendingReward } = useWallet();
  const [credited, setCredited] = useState<null | {
    awarded: number;
    alreadyCredited: boolean;
  }>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMultiplier, setSelectedMultiplier] =
    useState<RewardMultiplier | null>(null);

  const pending = wallet.pendingChallenge;

  useEffect(() => {
    if (isLoaded && !pending && !credited) {
      router.replace("/");
    }
  }, [credited, isLoaded, pending, router]);

  useEffect(() => {
    if (!credited) return;

    const timer = window.setTimeout(() => {
      router.push("/");
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [credited, router]);

  if (!pending && !credited) {
    return null;
  }

  const modeLabel =
    pending?.mode === "camera"
      ? `${TARGET_SQUATS}/${TARGET_SQUATS} repeticiones detectadas por cámara`
      : `${getExerciseLabel(pending?.exercise ?? "sentadillas")} completado`;

  const award =
    credited?.awarded ??
    (selectedMultiplier ? FIXED_REWARD_MIN * selectedMultiplier : 0);

  const spinRoulette = () => {
    if (isSpinning || selectedMultiplier || !pending) return;

    const multiplier = pickMultiplier();
    setSelectedMultiplier(multiplier);
    setIsSpinning(true);

    window.setTimeout(() => {
      const result = creditPendingReward(multiplier);
      setCredited({
        awarded: result.awarded,
        alreadyCredited: result.alreadyCredited,
      });
      setIsSpinning(false);
    }, 2500);
  };

  return (
    <AppShell
      eyebrow="Nivel completado"
      title="¡Lo lograste!"
      subtitle={`${TARGET_SQUATS} sentadillas desbloquearon la ruleta. Gira y suma ${FIXED_REWARD_MIN} min x bonus.`}
      backHref="/"
    >
      <div className="space-y-4">
        <RewardCelebration
          awarded={award}
          selectedMultiplier={selectedMultiplier}
          isSpinning={isSpinning}
          isCredited={Boolean(credited)}
          onSpin={spinRoulette}
        />

        <Notice>
          {modeLabel}. El premio se acreditará automáticamente al terminar el giro.
        </Notice>

        {credited ? (
          <div className="rounded-[24px] border border-emerald-100 bg-white p-4 text-center shadow-sm">
            <p className="text-lg font-black">
              {credited.alreadyCredited
                ? "Esta recompensa ya estaba acreditada."
                : `Se agregaron +${credited.awarded} minutos virtuales.`}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Puedes revisar el nuevo saldo e historial en el inicio.
            </p>
          </div>
        ) : null}

        <Link
          href="/"
          className="flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black"
        >
          Ir a mi billetera
        </Link>
      </div>
    </AppShell>
  );
}

function pickMultiplier(): RewardMultiplier {
  const random =
    typeof crypto !== "undefined" && "getRandomValues" in crypto
      ? crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
      : Math.random();
  const index = Math.floor(random * REWARD_MULTIPLIERS.length);

  return REWARD_MULTIPLIERS[Math.min(index, REWARD_MULTIPLIERS.length - 1)];
}
