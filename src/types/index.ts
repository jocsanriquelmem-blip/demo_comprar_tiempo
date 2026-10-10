import type { DAILY_CAP_OPTIONS, REWARD_MULTIPLIERS } from "@/lib/constants";
import type { ExerciseSlug } from "@/lib/exercises";

export type DailyBonusCapMinutes = (typeof DAILY_CAP_OPTIONS)[number];
export type RewardMultiplier = (typeof REWARD_MULTIPLIERS)[number];
export type Exercise = ExerciseSlug;
export type ChallengeMode = "camera" | "manual";

export type ChallengeRecord = {
  challengeId: string;
  completedAt: string;
  exercise: Exercise;
  reps: number;
  minutesAwarded: number;
  rewardMultiplier?: RewardMultiplier;
  mode: ChallengeMode;
};

export type PendingChallenge = {
  challengeId: string;
  completedAt: string;
  exercise: Exercise;
  reps: number;
  mode: ChallengeMode;
};

export type WalletState = {
  version: 2;
  balanceMinutes: number;
  dailyBonusCapMinutes: DailyBonusCapMinutes;
  history: ChallengeRecord[];
  pendingChallenge?: PendingChallenge;
};
