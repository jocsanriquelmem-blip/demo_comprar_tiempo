"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Notice } from "@/components/AppShell";
import { RewardCelebration } from "@/components/RewardCelebration";
import { useWallet } from "@/hooks/useWallet";
import {
  FIXED_REWARD_MIN,
  REWARD_MULTIPLIERS,
  TARGET_SQUATS,
} from "@/lib/constants";
import { getExerciseLabel } from "@/lib/exercises";
import { getAvailableRewardWithMultiplier } from "@/lib/wallet";
import type { RewardMultiplier } from "@/types";

export default function RewardPage() {
  const router = useRouter();
  const { wallet, isLoaded, creditPendingReward } = useWallet();
  const [credited, setCredited] = useState<null | {
    awarded: number;
    alreadyCredited: boolean;
  }>(null);
  const [selectedMultiplier, setSelectedMultiplier] =
    useState<RewardMultiplier | null>(null);

  const pending = wallet.pendingChallenge;
  const awardPreview = useMemo(
    () =>
      isLoaded && selectedMultiplier
        ? getAvailableRewardWithMultiplier(wallet, selectedMultiplier)
        : 0,
    [isLoaded, selectedMultiplier, wallet],
  );

  useEffect(() => {
    if (isLoaded && !pending && !credited) {
      router.replace("/");
    }
  }, [credited, isLoaded, pending, router]);

  if (!pending && !credited) {
    return null;
  }

  const modeLabel =
    pending?.mode === "camera"
      ? `${TARGET_SQUATS}/${TARGET_SQUATS} repeticiones detectadas por cámara`
      : `${getExerciseLabel(pending?.exercise ?? "sentadillas")} completado`;

  const award = credited?.awarded ?? awardPreview;

  return (
    <AppShell
      eyebrow="Nivel completado"
      title="¡Lo lograste!"
      subtitle={`Ahora gira la ruleta: ${TARGET_SQUATS} sentadillas = ${FIXED_REWARD_MIN} min base por multiplicador.`}
      backHref="/"
    >
      <div className="space-y-4">
        <RewardCelebration
          awarded={award}
          selectedMultiplier={selectedMultiplier}
          onSpin={() => {
            const index = Math.floor(Math.random() * REWARD_MULTIPLIERS.length);
            setSelectedMultiplier(REWARD_MULTIPLIERS[index]);
          }}
        />

        <Notice>
          {modeLabel}. La recompensa se limita por el tope diario configurado.
        </Notice>

        {selectedMultiplier && awardPreview < FIXED_REWARD_MIN * selectedMultiplier && !credited ? (
          <Notice>
            El multiplicador x{selectedMultiplier} supera el remanente diario,
            por eso se acreditarán {awardPreview} minutos virtuales.
          </Notice>
        ) : null}

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
        ) : (
          <button
            type="button"
            disabled={!selectedMultiplier}
            onClick={() => {
              if (!selectedMultiplier) return;
              const result = creditPendingReward(selectedMultiplier);
              setCredited({
                awarded: result.awarded,
                alreadyCredited: result.alreadyCredited,
              });
            }}
            className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white disabled:opacity-40"
          >
            {selectedMultiplier
              ? `Agregar +${awardPreview} minutos a mi billetera`
              : "Primero gira la ruleta"}
          </button>
        )}

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
