"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ChallengeMode,
  DailyBonusCapMinutes,
  Exercise,
  RewardMultiplier,
  WalletState,
} from "@/types";
import {
  applyReward,
  createInitialWalletState,
  createPendingChallenge,
  getAvailableReward,
  getCompletedToday,
  getEarnedToday,
  readStoredWallet,
  writeStoredWallet,
} from "@/lib/wallet";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(createInitialWalletState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPersistent, setIsPersistent] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = readStoredWallet();
      setWallet(stored.state);
      setIsPersistent(stored.isPersistent);
      setIsLoaded(true);
    });
  }, []);

  const persist = useCallback((next: WalletState) => {
    setWallet(next);
    setIsPersistent(writeStoredWallet(next));
  }, []);

  const stats = useMemo(
    () =>
      isLoaded
        ? {
            earnedToday: getEarnedToday(wallet),
            completedToday: getCompletedToday(wallet),
            availableReward: getAvailableReward(wallet),
          }
        : {
            earnedToday: 0,
            completedToday: 0,
            availableReward: 0,
          },
    [isLoaded, wallet],
  );

  const setDailyCap = useCallback(
    (dailyBonusCapMinutes: DailyBonusCapMinutes) => {
      persist({ ...wallet, dailyBonusCapMinutes });
    },
    [persist, wallet],
  );

  const completeChallenge = useCallback(
    (mode: ChallengeMode, exercise: Exercise = "sentadillas", reps = 10) => {
      const next = {
        ...wallet,
        pendingChallenge: createPendingChallenge(mode, exercise, reps),
      };
      persist(next);
      return next.pendingChallenge;
    },
    [persist, wallet],
  );

  const creditPendingReward = useCallback((multiplier: RewardMultiplier) => {
    const result = applyReward(wallet, multiplier);
    persist(result.state);
    return result;
  }, [persist, wallet]);

  const resetProgress = useCallback(() => {
    persist(createInitialWalletState());
  }, [persist]);

  return {
    wallet,
    isLoaded,
    isPersistent,
    stats,
    setDailyCap,
    completeChallenge,
    creditPendingReward,
    resetProgress,
  };
}
