"use client";

import { motion, useReducedMotion } from "motion/react";
import { Gift, Sparkles } from "lucide-react";
import { REWARD_MULTIPLIERS } from "@/lib/constants";
import type { RewardMultiplier } from "@/types";

export function RewardCelebration({
  awarded,
  selectedMultiplier,
  onSpin,
}: {
  awarded: number;
  selectedMultiplier: RewardMultiplier | null;
  onSpin: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const selectedIndex = selectedMultiplier
    ? REWARD_MULTIPLIERS.indexOf(selectedMultiplier)
    : 0;
  const segmentSize = 360 / REWARD_MULTIPLIERS.length;
  const rotation = selectedMultiplier
    ? 1440 + (360 - (selectedIndex * segmentSize + segmentSize / 2))
    : 0;

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-amber-100 bg-white p-5 text-center shadow-xl shadow-amber-100/60">
      {!reduceMotion
        ? [0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
            <motion.span
              key={item}
              aria-hidden
              initial={{ opacity: 0, y: 20, scale: 0.6 }}
              animate={
                selectedMultiplier
                  ? { opacity: [0, 1, 0], y: -190, scale: [0.6, 1.3, 1] }
                  : {}
              }
              transition={{ delay: item * 0.08, duration: 1.5, repeat: 1 }}
              className="absolute bottom-12 size-3 rounded-full"
              style={{
                left: `${9 + item * 12}%`,
                backgroundColor: ["#facc15", "#34d399", "#60a5fa", "#c084fc"][
                  item % 4
                ],
              }}
            />
          ))
        : null}

      <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-700">
        Ruleta de energía
      </p>
      <p className="mt-1 text-sm font-bold leading-5 text-slate-600">
        Multiplicador de premio: x2, x4, x6, x8, x10 o x20.
      </p>

      <div className="relative mx-auto my-5 size-64">
        <div className="absolute left-1/2 top-[-2px] z-20 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[24px] border-x-transparent border-t-slate-950" />
        <motion.div
          animate={reduceMotion ? undefined : { rotate: rotation }}
          transition={{
            duration: selectedMultiplier ? 2.25 : 0.4,
            ease: [0.18, 0.86, 0.32, 1],
          }}
          className="relative grid size-full place-items-center rounded-full border-[10px] border-white bg-[conic-gradient(from_0deg,#facc15_0_60deg,#34d399_60deg_120deg,#60a5fa_120deg_180deg,#c084fc_180deg_240deg,#fb7185_240deg_300deg,#22d3ee_300deg_360deg)] shadow-2xl shadow-violet-200"
        >
          {REWARD_MULTIPLIERS.map((multiplier, index) => (
            <span
              key={multiplier}
              className="absolute left-1/2 top-1/2 text-xl font-black text-white drop-shadow"
              style={{
                transform: `rotate(${
                  index * segmentSize + segmentSize / 2
                }deg) translateY(-92px) rotate(-${
                  index * segmentSize + segmentSize / 2
                }deg)`,
              }}
            >
              x{multiplier}
            </span>
          ))}
          <div className="grid size-28 place-items-center rounded-full border-4 border-white bg-slate-950 text-white shadow-xl">
            <div>
              <Gift aria-hidden className="mx-auto" size={30} />
              <p className="mt-1 text-2xl font-black">+{awarded}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {!selectedMultiplier ? (
        <button
          type="button"
          onClick={onSpin}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-violet-200"
        >
          <Sparkles aria-hidden size={20} />
          Girar ruleta
        </button>
      ) : (
        <motion.div
          initial={reduceMotion ? false : { scale: 0.92, opacity: 0 }}
          animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
          className="rounded-3xl bg-emerald-50 px-4 py-4"
        >
          <p className="text-sm font-black uppercase tracking-[0.14em] text-emerald-700">
          Resultado
          </p>
          <p className="mt-1 text-5xl font-black text-slate-950">
            x{selectedMultiplier}
          </p>
          <p className="text-sm font-bold text-slate-600">
            Premio final: +{awarded} minutos virtuales
          </p>
        </motion.div>
      )}
    </div>
  );
}
