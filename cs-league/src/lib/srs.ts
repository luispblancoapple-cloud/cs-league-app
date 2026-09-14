import { AppState, Manifest, Question, QuestionStat, SessionQuestion, TestMeta } from './types';
import { todayStr, daysBetween } from './storage';

export const BOX_INTERVALS = [0, 1, 2, 4, 7, 14, 30]; // days until due, indexed by box
export const MAX_BOX = BOX_INTERVALS.length - 1;

export function qid(testId: number, number: number): string {
  return `${testId}_${number}`;
}

export function getStat(state: AppState, id: string): QuestionStat {
  return (
    state.questionStats[id] ?? {
      box: 0,
      nextDue: null,
      seen: 0,
      correct: 0,
      lastResult: null,
    }
  );
}

export function applyAnswer(state: AppState, id: string, correct: boolean): AppState {
  const prev = getStat(state, id);
  let box = prev.box;
  if (correct) {
    box = Math.min(MAX_BOX, box + 1);
  } else {
    box = 0;
  }
  const interval = BOX_INTERVALS[box];
  const due = new Date();
  due.setDate(due.getDate() + interval);
  const nextDue = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(
    due.getDate()
  ).padStart(2, '0')}`;

  const stat: QuestionStat = {
    box,
    nextDue,
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    lastResult: correct ? 'correct' : 'incorrect',
  };

  return {
    ...state,
    questionStats: { ...state.questionStats, [id]: stat },
  };
}

// ---- Unit ordering ----

const LEVEL_RANK: Record<string, number> = {
  'Invitational A': 0,
  'Invitational B': 0,
  Invitational: 0,
  District: 1,
  Region: 2,
  State: 3,
};

export function orderedUnits(tests: TestMeta[]): TestMeta[] {
  return [...tests].sort((a, b) => {
    const ra = LEVEL_RANK[a.level] ?? 5;
    const rb = LEVEL_RANK[b.level] ?? 5;
    if (ra !== rb) return ra - rb;
    if (a.year !== b.year) return a.year.localeCompare(b.year);
    return a.level.localeCompare(b.level);
  });
}

export function unitQuestions(manifest: Manifest, testId: number): Question[] {
  return manifest.questions
    .filter((q) => q.testId === testId)
    .sort((a, b) => a.number - b.number);
}

export function unitSeenCount(state: AppState, manifest: Manifest, testId: number): number {
  const qs = unitQuestions(manifest, testId);
  return qs.filter((q) => getStat(state, qid(q.testId, q.number)).seen > 0).length;
}

export function isUnitComplete(state: AppState, manifest: Manifest, testId: number): boolean {
  return unitSeenCount(state, manifest, testId) >= unitQuestions(manifest, testId).length;
}

export function isUnitUnlocked(
  state: AppState,
  manifest: Manifest,
  units: TestMeta[],
  testId: number
): boolean {
  const idx = units.findIndex((u) => u.id === testId);
  if (idx <= 0) return true;
  return isUnitComplete(state, manifest, units[idx - 1].id);
}

export function currentActiveUnit(state: AppState, manifest: Manifest, units: TestMeta[]): TestMeta {
  for (const u of units) {
    if (!isUnitComplete(state, manifest, u.id)) return u;
  }
  return units[units.length - 1];
}

// ---- Session building ----

function toSessionQ(q: Question): SessionQuestion {
  return { ...q, qid: qid(q.testId, q.number) };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dueReviewQuestions(state: AppState, manifest: Manifest): Question[] {
  const today = todayStr();
  return manifest.questions
    .filter((q) => {
      const s = getStat(state, qid(q.testId, q.number));
      return s.seen > 0 && s.box < MAX_BOX && s.nextDue !== null && s.nextDue <= today;
    })
    .sort((a, b) => {
      const sa = getStat(state, qid(a.testId, a.number));
      const sb = getStat(state, qid(b.testId, b.number));
      return daysBetween(sb.nextDue!, today) - daysBetween(sa.nextDue!, today); // most overdue first
    });
}

export function buildDailyLesson(
  state: AppState,
  manifest: Manifest,
  units: TestMeta[]
): SessionQuestion[] {
  const goal = state.dailyGoal;
  const due = dueReviewQuestions(state, manifest);
  const reviewSlots = Math.min(due.length, Math.max(1, Math.floor(goal * 0.4)));
  const reviewPicked = due.slice(0, reviewSlots);
  const pickedIds = new Set(reviewPicked.map((q) => qid(q.testId, q.number)));

  const newSlots = goal - reviewPicked.length;
  const newPicked: Question[] = [];
  if (newSlots > 0) {
    for (const unit of units) {
      if (newPicked.length >= newSlots) break;
      const qs = unitQuestions(manifest, unit.id).filter(
        (q) => getStat(state, qid(q.testId, q.number)).seen === 0
      );
      for (const q of qs) {
        if (newPicked.length >= newSlots) break;
        newPicked.push(q);
      }
    }
  }
  for (const q of newPicked) pickedIds.add(qid(q.testId, q.number));

  // if still short (e.g. everything mastered), pad with more due/random review
  let combined = [...reviewPicked, ...newPicked];
  if (combined.length < goal) {
    const more = due.slice(reviewSlots).filter((q) => !pickedIds.has(qid(q.testId, q.number)));
    combined = combined.concat(more.slice(0, goal - combined.length));
  }
  if (combined.length < goal) {
    const anySeen = manifest.questions.filter((q) => !pickedIds.has(qid(q.testId, q.number)));
    combined = combined.concat(shuffle(anySeen).slice(0, goal - combined.length));
  }

  return shuffle(combined).map(toSessionQ);
}

const UNIT_SESSION_SIZE = 20;

export function buildUnitPractice(
  state: AppState,
  manifest: Manifest,
  testId: number
): SessionQuestion[] {
  const qs = unitQuestions(manifest, testId);
  const unseen = qs.filter((q) => getStat(state, qid(q.testId, q.number)).seen === 0);
  if (unseen.length > 0) {
    return unseen.slice(0, UNIT_SESSION_SIZE).map(toSessionQ);
  }
  // whole unit already seen at least once -> light shuffled review of the unit
  const seen = qs.filter((q) => getStat(state, qid(q.testId, q.number)).seen > 0);
  return shuffle(seen).slice(0, UNIT_SESSION_SIZE).map(toSessionQ);
}
