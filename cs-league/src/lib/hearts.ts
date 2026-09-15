import { AppState } from './types';

export const MAX_HEARTS = 5;
export const REGEN_INTERVAL_MS = 4 * 60 * 60 * 1000; // 1 heart every 4 hours
export const GEM_REFILL_COST = 30;

// Call on app load and before starting any lesson - catches up on regeneration
// that happened while the app was closed.
export function refillHeartsForElapsedTime(state: AppState): AppState {
  if (state.hearts >= MAX_HEARTS || state.heartsRegenAt === null) {
    return state.hearts >= MAX_HEARTS ? { ...state, heartsRegenAt: null } : state;
  }
  const now = Date.now();
  if (now < state.heartsRegenAt) return state;
  const elapsed = now - state.heartsRegenAt;
  const gained = Math.floor(elapsed / REGEN_INTERVAL_MS) + 1;
  const newHearts = Math.min(MAX_HEARTS, state.hearts + gained);
  const newRegenAt =
    newHearts >= MAX_HEARTS ? null : state.heartsRegenAt + gained * REGEN_INTERVAL_MS;
  return { ...state, hearts: newHearts, heartsRegenAt: newRegenAt };
}

export function loseHeart(state: AppState): AppState {
  const wasFull = state.hearts >= MAX_HEARTS;
  const newHearts = Math.max(0, state.hearts - 1);
  const newRegenAt = wasFull ? Date.now() + REGEN_INTERVAL_MS : state.heartsRegenAt;
  return { ...state, hearts: newHearts, heartsRegenAt: newRegenAt };
}

export function refillWithGems(state: AppState): AppState | null {
  if (state.gems < GEM_REFILL_COST) return null;
  return { ...state, hearts: MAX_HEARTS, heartsRegenAt: null, gems: state.gems - GEM_REFILL_COST };
}

export function timeUntilNextHeart(state: AppState): string | null {
  if (state.hearts >= MAX_HEARTS || state.heartsRegenAt === null) return null;
  const ms = Math.max(0, state.heartsRegenAt - Date.now());
  const totalMinutes = Math.ceil(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
