import { AppState, Manifest, Question, QuestionStat, SessionQuestion, TopicMeta } from './types';
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

// ---- Topic (unit) ordering ----

export function orderedUnits(topics: TopicMeta[]): TopicMeta[] {
  return topics; // manifest already lists topics in pedagogical order
}

export function unitQuestions(manifest: Manifest, topicId: string): Question[] {
  return manifest.questions.filter((q) => q.topic === topicId);
}

export function unitSeenCount(state: AppState, manifest: Manifest, topicId: string): number {
  const qs = unitQuestions(manifest, topicId);
  return qs.filter((q) => getStat(state, qid(q.testId, q.number)).seen > 0).length;
}

export function isUnitComplete(state: AppState, manifest: Manifest, topicId: string): boolean {
  const qs = unitQuestions(manifest, topicId);
  return qs.length > 0 && unitSeenCount(state, manifest, topicId) >= qs.length;
}

export function isUnitUnlocked(
  _state: AppState,
  _manifest: Manifest,
  _units: TopicMeta[],
  _topicId: string
): boolean {
  return true; // every topic can be practiced any time
}

export interface TopicStats {
  topicId: string;
  totalQuestions: number;
  seenQuestions: number;
  attempts: number;
  correctAttempts: number;
  accuracyPct: number | null; // null when no attempts yet
}

export function topicStats(state: AppState, manifest: Manifest, topicId: string): TopicStats {
  const qs = unitQuestions(manifest, topicId);
  let attempts = 0;
  let correctAttempts = 0;
  let seenQuestions = 0;
  for (const q of qs) {
    const s = getStat(state, qid(q.testId, q.number));
    if (s.seen > 0) seenQuestions++;
    attempts += s.seen;
    correctAttempts += s.correct;
  }
  return {
    topicId,
    totalQuestions: qs.length,
    seenQuestions,
    attempts,
    correctAttempts,
    accuracyPct: attempts > 0 ? Math.round((correctAttempts / attempts) * 100) : null,
  };
}

export function currentActiveUnit(state: AppState, manifest: Manifest, units: TopicMeta[]): TopicMeta {
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
  units: TopicMeta[]
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
  topicId: string
): SessionQuestion[] {
  const qs = unitQuestions(manifest, topicId);
  const unseen = qs.filter((q) => getStat(state, qid(q.testId, q.number)).seen === 0);
  if (unseen.length > 0) {
    return shuffle(unseen).slice(0, UNIT_SESSION_SIZE).map(toSessionQ);
  }
  const seen = qs.filter((q) => getStat(state, qid(q.testId, q.number)).seen > 0);
  return shuffle(seen).slice(0, UNIT_SESSION_SIZE).map(toSessionQ);
}
