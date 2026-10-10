"use client";

import { motion } from "motion/react";
import { Coins, Trophy } from "lucide-react";
import type { WalletState } from "@/types";

export function WalletCard({
  wallet,
  earnedToday,
}: {
  wallet: WalletState;
  earnedToday: number;
}) {
  const progress = Math.min(100, (earnedToday / wallet.dailyBonusCapMinutes) * 100);

  return (
    <section className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
            <Coins aria-hidden size={24} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-500">Tus minutos virtuales</p>
            <motion.p
              key={wallet.balanceMinutes}
              initial={{ scale: 0.94, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-black leading-none text-slate-950"
            >
              {wallet.balanceMinutes}
              <span className="ml-1 text-xl font-black text-slate-500">min</span>
            </motion.p>
          </div>
        </div>
        <span className="grid size-10 place-items-center rounded-full bg-violet-100 text-violet-800">
          <Trophy aria-hidden size={20} />
        </span>
      </div>
      <div>
        <div className="mb-2 flex justify-between text-sm font-bold text-slate-600">
          <span>Ganado hoy</span>
          <span>
            {earnedToday}/{wallet.dailyBonusCapMinutes} min
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full rounded-full bg-emerald-500"
          />
        </div>
      </div>
    </section>
  );
}
