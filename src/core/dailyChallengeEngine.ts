import { PracticeQuestion } from '../data/questionBank.ts';

export interface DailyChallengeAttempt {
  dateKey: string;
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  submittedAt: string;
}

export interface DailyChallengeStorageState {
  attemptsByDate: Record<string, DailyChallengeAttempt>;
}

const STORAGE_KEY = 'algebralab.dailyChallenge.v1';

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatChallengeDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getMsUntilNextDay(now: Date = new Date()): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, nextMidnight.getTime() - now.getTime());
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getCalendarDayNumber(date: Date): number {
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(utcMidnight / 86_400_000);
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EPOCH_DAY_NUMBER = Math.floor(Date.UTC(2026, 0, 1) / 86_400_000);

/**
 * Selects one unique, pseudo-randomly distributed question from the verified bank
 * for the given local calendar date. Within every N-day cycle (N = bank.length),
 * each question appears strictly once before any question can repeat.
 */
export function selectDailyAlgebraChallenge(
  bank: PracticeQuestion[],
  date: Date = new Date()
): { question: PracticeQuestion; dateKey: string; cycleDay: number } {
  if (bank.length === 0) {
    throw new Error('Cannot select a Daily Algebra Challenge from an empty question bank.');
  }

  const n = bank.length;
  const dayNumber = getCalendarDayNumber(date) - EPOCH_DAY_NUMBER;
  const cycleIndex = Math.floor(dayNumber / n);
  const posInCycle = ((dayNumber % n) + n) % n;

  const seed = (0x9e3779b9 ^ Math.imul(cycleIndex + 101, 0x85ebca6b)) >>> 0;
  const nextRand = mulberry32(seed);

  const indices = Array.from({ length: n }, (_, idx) => idx);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }

  return {
    question: bank[indices[posInCycle]],
    dateKey: getLocalDateKey(date),
    cycleDay: posInCycle + 1,
  };
}

export function loadDailyChallengeState(): DailyChallengeStorageState {
  if (typeof window === 'undefined') {
    return { attemptsByDate: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { attemptsByDate: {} };
    const parsed = JSON.parse(raw) as Partial<DailyChallengeStorageState>;
    if (!parsed || typeof parsed.attemptsByDate !== 'object' || parsed.attemptsByDate === null) {
      return { attemptsByDate: {} };
    }
    return { attemptsByDate: parsed.attemptsByDate };
  } catch {
    return { attemptsByDate: {} };
  }
}

export function saveDailyChallengeAttempt(attempt: DailyChallengeAttempt): DailyChallengeStorageState {
  const current = loadDailyChallengeState();
  const updated: DailyChallengeStorageState = {
    attemptsByDate: {
      ...current.attemptsByDate,
      [attempt.dateKey]: attempt,
    },
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage quota or sandbox restrictions
    }
  }
  return updated;
}

export function computeDailyStreak(
  attemptsByDate: Record<string, DailyChallengeAttempt>,
  today: Date = new Date()
): { currentStreak: number; totalCompleted: number; totalCorrect: number } {
  const entries = Object.values(attemptsByDate);
  const totalCompleted = entries.length;
  const totalCorrect = entries.filter((a) => a.isCorrect).length;

  const todayKey = getLocalDateKey(today);
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // If today isn't attempted yet, streak continues from yesterday
  if (!attemptsByDate[todayKey]) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let currentStreak = 0;
  while (true) {
    const key = getLocalDateKey(cursor);
    if (!attemptsByDate[key]) break;
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { currentStreak, totalCompleted, totalCorrect };
}
