export interface TopicMeta {
  id: string;
  name: string;
}

export interface Question {
  testId: number;
  number: number;
  image: string;
  options: string[];
  freeResponse: boolean;
  answer: string | null;
  explanation: string;
  topic: string;
}

export interface Manifest {
  topics: TopicMeta[];
  questions: Question[];
}

export interface QuestionStat {
  box: number; // 0 = new, 1-5 = leitner boxes, 6 = mastered
  nextDue: string | null; // ISO date string (yyyy-mm-dd)
  seen: number;
  correct: number;
  lastResult: 'correct' | 'incorrect' | null;
}

export interface UnitProgress {
  seenCount: number;
  correctCount: number;
}

export interface AppState {
  xp: number;
  gems: number;
  streak: number;
  longestStreak: number;
  lastSessionDate: string | null;
  dailyGoal: number;
  questionStats: Record<string, QuestionStat>;
  unitProgress: Record<string, UnitProgress>;
  sessionsCompleted: number;
  freezeAvailable: boolean;
  hearts: number;
  heartsRegenAt: number | null;
}

export interface SessionQuestion extends Question {
  qid: string;
}

export interface SessionResult {
  qid: string;
  correct: boolean;
  wasReview: boolean;
}
