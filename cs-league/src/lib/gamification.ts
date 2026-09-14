import { AppState } from './types';
import { todayStr, daysBetween } from './storage';

export const XP_CORRECT = 10;
export const XP_INCORRECT = 2;
export const XP_PERFECT_BONUS = 20;
export const GEMS_PER_SESSION = 5;
export const GEMS_PERFECT_BONUS = 10;
export const GEMS_UNIT_COMPLETE = 25;

export interface SessionSummary {
  total: number;
  correct: number;
  xpEarned: number;
  gemsEarned: number;
  streak: number;
  streakExtended: boolean;
  usedFreeze: boolean;
}

export function applySessionCompletion(
  state: AppState,
  total: number,
  correct: number
): { state: AppState; summary: SessionSummary } {
  const perfect = total > 0 && correct === total;
  let xpEarned = correct * XP_CORRECT + (total - correct) * XP_INCORRECT;
  let gemsEarned = GEMS_PER_SESSION;
  if (perfect) {
    xpEarned += XP_PERFECT_BONUS;
    gemsEarned += GEMS_PERFECT_BONUS;
  }

  const today = todayStr();
  let streak = state.streak;
  let streakExtended = false;
  let usedFreeze = false;
  let freezeAvailable = state.freezeAvailable;

  if (state.lastSessionDate === today) {
    // already did a session today, streak unchanged
  } else if (state.lastSessionDate === null) {
    streak = 1;
    streakExtended = true;
  } else {
    const gap = daysBetween(state.lastSessionDate, today);
    if (gap === 1) {
      streak = state.streak + 1;
      streakExtended = true;
    } else if (gap === 2 && state.freezeAvailable) {
      // streak freeze covers one missed day
      streak = state.streak + 1;
      streakExtended = true;
      usedFreeze = true;
      freezeAvailable = false;
    } else {
      streak = 1;
      streakExtended = true;
    }
  }

  const longestStreak = Math.max(state.longestStreak, streak);

  const newState: AppState = {
    ...state,
    xp: state.xp + xpEarned,
    gems: state.gems + gemsEarned,
    streak,
    longestStreak,
    lastSessionDate: today,
    sessionsCompleted: state.sessionsCompleted + 1,
    freezeAvailable,
  };

  return {
    state: newState,
    summary: { total, correct, xpEarned, gemsEarned, streak, streakExtended, usedFreeze },
  };
}

export function refreshFreeze(state: AppState): AppState {
  // grant a new streak freeze every 10 sessions if not already available
  if (!state.freezeAvailable && state.sessionsCompleted > 0 && state.sessionsCompleted % 10 === 0) {
    return { ...state, freezeAvailable: true };
  }
  return state;
}
