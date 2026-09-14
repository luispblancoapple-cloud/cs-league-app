import { AppState } from './types';
import { firebaseEnabled, loadRemoteState, saveRemoteState } from './firebase';

const LOCAL_KEY = 'cs-league-state-v1';

export function defaultState(): AppState {
  return {
    xp: 0,
    gems: 50,
    streak: 0,
    longestStreak: 0,
    lastSessionDate: null,
    dailyGoal: 15,
    questionStats: {},
    unitProgress: {},
    sessionsCompleted: 0,
    freezeAvailable: true,
  };
}

function loadLocal(): AppState | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

function saveLocal(state: AppState) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save to local storage', e);
  }
}

export async function loadState(): Promise<AppState> {
  const local = loadLocal();
  if (firebaseEnabled) {
    const remote = await loadRemoteState();
    if (remote) {
      // remote wins if it looks newer/more complete; merge is simplistic since single-user
      const merged = { ...defaultState(), ...local, ...remote } as AppState;
      saveLocal(merged);
      return merged;
    }
  }
  return local ?? defaultState();
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function persistState(state: AppState) {
  saveLocal(state);
  if (firebaseEnabled) {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      saveRemoteState(state);
    }, 1200);
  }
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db_ = new Date(b + 'T00:00:00');
  return Math.round((db_.getTime() - da.getTime()) / 86400000);
}
