import {
  DAILY_CAP_OPTIONS,
  DEFAULT_DAILY_BONUS_CAP_MIN,
  FIXED_REWARD_MIN,
  INITIAL_BALANCE_MIN,
  STORAGE_KEY,
} from "@/lib/constants";
import type {
  ChallengeMode,
  DailyBonusCapMinutes,
  PendingChallenge,
  RewardMultiplier,
  WalletState,
  Exercise,
} from "@/types";

export function createInitialWalletState(): WalletState {
  return {
    version: 2,
    balanceMinutes: INITIAL_BALANCE_MIN,
    dailyBonusCapMinutes: DEFAULT_DAILY_BONUS_CAP_MIN,
    history: [],
  };
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getEarnedToday(state: WalletState) {
  const today = todayKey();
  return state.history
    .filter((item) => item.completedAt.slice(0, 10) === today)
    .reduce((total, item) => total + item.minutesAwarded, 0);
}

export function getCompletedToday(state: WalletState) {
  const today = todayKey();
  return state.history.filter((item) => item.completedAt.slice(0, 10) === today)
    .length;
}

export function getAvailableReward(state: WalletState) {
  return Math.max(
    0,
    Math.min(FIXED_REWARD_MIN, state.dailyBonusCapMinutes - getEarnedToday(state)),
  );
}

export function getAvailableRewardWithMultiplier(
  state: WalletState,
  multiplier: RewardMultiplier,
) {
  return FIXED_REWARD_MIN * multiplier;
}

export function isDailyCap(value: number): value is DailyBonusCapMinutes {
  return DAILY_CAP_OPTIONS.includes(value as DailyBonusCapMinutes);
}

export function parseWalletState(raw: string | null): WalletState {
  if (!raw) return createInitialWalletState();

  try {
    const parsed = JSON.parse(raw) as Partial<WalletState> & { version?: number };

    if (parsed.version !== 2) {
      return createInitialWalletState();
    }

    const dailyCap = Number(parsed.dailyBonusCapMinutes);

    return {
      version: 2,
      balanceMinutes:
        typeof parsed.balanceMinutes === "number"
          ? parsed.balanceMinutes
          : INITIAL_BALANCE_MIN,
      dailyBonusCapMinutes: isDailyCap(dailyCap)
        ? dailyCap
        : DEFAULT_DAILY_BONUS_CAP_MIN,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      pendingChallenge: parsed.pendingChallenge,
    };
  } catch {
    return createInitialWalletState();
  }
}

export function readStoredWallet(): {
  state: WalletState;
  isPersistent: boolean;
} {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return { state: createInitialWalletState(), isPersistent: false };
  }

  try {
    return {
      state: parseWalletState(window.localStorage.getItem(STORAGE_KEY)),
      isPersistent: true,
    };
  } catch {
    return { state: createInitialWalletState(), isPersistent: false };
  }
}

export function writeStoredWallet(state: WalletState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function createPendingChallenge(
  mode: ChallengeMode,
  exercise: Exercise,
  reps: number,
): PendingChallenge {
  const now = new Date().toISOString();
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    challengeId: `${exercise}-${suffix}`,
    completedAt: now,
    exercise,
    reps,
    mode,
  };
}

export function applyReward(state: WalletState, multiplier: RewardMultiplier) {
  const pending = state.pendingChallenge;

  if (!pending) {
    return { state, awarded: 0, alreadyCredited: false };
  }

  const alreadyCredited = state.history.some(
    (item) => item.challengeId === pending.challengeId,
  );

  if (alreadyCredited) {
    const rest = { ...state };
    delete rest.pendingChallenge;
    return { state: rest, awarded: 0, alreadyCredited: true };
  }

  const awarded = getAvailableRewardWithMultiplier(state, multiplier);
  const rest = { ...state };
  delete rest.pendingChallenge;

  return {
    state: {
      ...rest,
      balanceMinutes: state.balanceMinutes + awarded,
      history: [
        {
          ...pending,
          minutesAwarded: awarded,
          rewardMultiplier: multiplier,
        },
        ...state.history,
      ],
    },
    awarded,
    alreadyCredited: false,
  };
}
