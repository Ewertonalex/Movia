import type { EquipmentTag, Exercise, WeekdayKey, WeeklyPlan } from "@/lib/types";

export const SESSION_LOG_KEY = "movia-session-log-v1";
const KEEP_DAYS = 120;

const WEEK_ORDER: WeekdayKey[] = [
  "seg",
  "ter",
  "qua",
  "qui",
  "sex",
  "sab",
  "dom",
];

const LOAD_EQUIPMENT = new Set<EquipmentTag>([
  "halteres",
  "barra",
  "anilhas",
  "kettlebell",
  "caneleira",
  "cabos",
  "maquinas",
  "smith",
  "leg_press",
]);

export type SessionSetStatus = "done" | "skipped";

export interface SessionSetEntry {
  status: SessionSetStatus;
  at: string;
  load?: string;
}

export interface SessionExerciseEntry {
  exerciseId: string;
  sets: SessionSetEntry[];
  skipped: boolean;
  load?: string;
}

export interface SessionDayEntry {
  date: string;
  weekday: WeekdayKey;
  planCreatedAt: string;
  exercises: SessionExerciseEntry[];
}

export interface SessionLogState {
  days: SessionDayEntry[];
}

export interface ExerciseSessionProgress {
  completedSets: number;
  skipped: boolean;
  finished: boolean;
  load?: string;
}

export interface WeekDayProgress {
  weekday: WeekdayKey;
  rest: boolean;
  date: string;
  isToday: boolean;
  total: number;
  finished: number;
  skipped: number;
}

export interface SessionPeriodStats {
  trainingDays: number;
  finishedExercises: number;
  skippedExercises: number;
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfWeekMonday(now = new Date()): Date {
  const monday = new Date(now);
  monday.setHours(12, 0, 0, 0);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  return monday;
}

export function dateOfWeekdayThisWeek(
  weekday: WeekdayKey,
  now = new Date(),
): Date {
  const monday = startOfWeekMonday(now);
  const index = WEEK_ORDER.indexOf(weekday);
  const date = new Date(monday);
  date.setDate(monday.getDate() + Math.max(0, index));
  return date;
}

export function normalizeLoad(value: string): string | undefined {
  const trimmed = value.trim().slice(0, 24);
  return trimmed.length > 0 ? trimmed : undefined;
}

export function usesExternalLoad(exercise: Exercise | undefined): boolean {
  if (!exercise) return false;
  return exercise.equipmentRequired.some((tag) => LOAD_EQUIPMENT.has(tag));
}

function emptyState(): SessionLogState {
  return { days: [] };
}

function isLogState(value: unknown): value is SessionLogState {
  if (typeof value !== "object" || value === null) return false;
  return Array.isArray((value as SessionLogState).days);
}

function prune(days: SessionDayEntry[], now = new Date()): SessionDayEntry[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const key = localDateKey(cutoff);
  return days.filter((day) => day.date >= key);
}

export function loadSessionLog(): SessionLogState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(SESSION_LOG_KEY);
    if (!raw) return emptyState();
    const parsed: unknown = JSON.parse(raw);
    if (!isLogState(parsed)) return emptyState();
    return { days: prune(parsed.days) };
  } catch {
    return emptyState();
  }
}

export function saveSessionLog(state: SessionLogState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SESSION_LOG_KEY,
      JSON.stringify({ days: prune(state.days) }),
    );
  } catch {
    // armazenamento indisponível
  }
}

const listeners = new Set<() => void>();
let snapshot: SessionLogState | undefined;

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToSessionLog(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSessionLogSnapshot(): SessionLogState {
  if (snapshot === undefined) snapshot = loadSessionLog();
  return snapshot;
}

export function getServerSessionLog(): SessionLogState {
  return emptyState();
}

export function publishSessionLog(state: SessionLogState): void {
  snapshot = { days: prune(state.days) };
  saveSessionLog(snapshot);
  emit();
}

function dayKey(date: string, weekday: WeekdayKey, planCreatedAt: string) {
  return `${planCreatedAt}:${date}:${weekday}`;
}

function ensureDay(
  state: SessionLogState,
  date: string,
  weekday: WeekdayKey,
  planCreatedAt: string,
): { next: SessionLogState; day: SessionDayEntry } {
  const key = dayKey(date, weekday, planCreatedAt);
  const existing = state.days.find(
    (item) => dayKey(item.date, item.weekday, item.planCreatedAt) === key,
  );
  if (existing) return { next: state, day: existing };
  const day: SessionDayEntry = {
    date,
    weekday,
    planCreatedAt,
    exercises: [],
  };
  return { next: { days: [...state.days, day] }, day };
}

function replaceDay(
  state: SessionLogState,
  day: SessionDayEntry,
): SessionLogState {
  const key = dayKey(day.date, day.weekday, day.planCreatedAt);
  return {
    days: state.days.map((item) =>
      dayKey(item.date, item.weekday, item.planCreatedAt) === key ? day : item,
    ),
  };
}

function exerciseEntry(
  day: SessionDayEntry,
  exerciseId: string,
): SessionExerciseEntry {
  return (
    day.exercises.find((item) => item.exerciseId === exerciseId) ?? {
      exerciseId,
      sets: [],
      skipped: false,
    }
  );
}

function upsertExercise(
  day: SessionDayEntry,
  entry: SessionExerciseEntry,
): SessionDayEntry {
  const others = day.exercises.filter(
    (item) => item.exerciseId !== entry.exerciseId,
  );
  return { ...day, exercises: [...others, entry] };
}

export function getExerciseProgress(
  state: SessionLogState,
  date: string,
  weekday: WeekdayKey,
  planCreatedAt: string,
  exerciseId: string,
  plannedSets: number,
): ExerciseSessionProgress {
  const day = state.days.find(
    (item) =>
      item.date === date &&
      item.weekday === weekday &&
      item.planCreatedAt === planCreatedAt,
  );
  const entry = day?.exercises.find((item) => item.exerciseId === exerciseId);
  const completedSets =
    entry?.sets.filter((item) => item.status === "done").length ?? 0;
  const skipped = Boolean(entry?.skipped);
  return {
    completedSets,
    skipped,
    finished: skipped || completedSets >= plannedSets,
    load: entry?.load,
  };
}

export function logSetDone(
  state: SessionLogState,
  input: {
    date: string;
    weekday: WeekdayKey;
    planCreatedAt: string;
    exerciseId: string;
    plannedSets: number;
    load?: string;
    at?: string;
  },
): SessionLogState {
  const { next, day } = ensureDay(
    state,
    input.date,
    input.weekday,
    input.planCreatedAt,
  );
  const current = exerciseEntry(day, input.exerciseId);
  if (current.skipped) return next;
  const doneCount = current.sets.filter((item) => item.status === "done").length;
  if (doneCount >= input.plannedSets) return next;
  const load = input.load ?? current.load;
  const updated = upsertExercise(day, {
    ...current,
    skipped: false,
    load,
    sets: [
      ...current.sets,
      {
        status: "done",
        at: input.at ?? new Date().toISOString(),
        load,
      },
    ],
  });
  return replaceDay(next, updated);
}

export function logExerciseSkipped(
  state: SessionLogState,
  input: {
    date: string;
    weekday: WeekdayKey;
    planCreatedAt: string;
    exerciseId: string;
    at?: string;
  },
): SessionLogState {
  const { next, day } = ensureDay(
    state,
    input.date,
    input.weekday,
    input.planCreatedAt,
  );
  const current = exerciseEntry(day, input.exerciseId);
  if (current.skipped) return next;
  const updated = upsertExercise(day, {
    ...current,
    skipped: true,
    sets: [
      ...current.sets,
      {
        status: "skipped",
        at: input.at ?? new Date().toISOString(),
      },
    ],
  });
  return replaceDay(next, updated);
}

export function undoExerciseSession(
  state: SessionLogState,
  input: {
    date: string;
    weekday: WeekdayKey;
    planCreatedAt: string;
    exerciseId: string;
  },
): SessionLogState {
  const day = state.days.find(
    (item) =>
      item.date === input.date &&
      item.weekday === input.weekday &&
      item.planCreatedAt === input.planCreatedAt,
  );
  if (!day) return state;
  const updated = {
    ...day,
    exercises: day.exercises.filter(
      (item) => item.exerciseId !== input.exerciseId,
    ),
  };
  return replaceDay(state, updated);
}

export function weekProgress(
  plan: WeeklyPlan,
  state: SessionLogState,
  now = new Date(),
): WeekDayProgress[] {
  const today = localDateKey(now);
  return plan.days.map((day) => {
    const date = localDateKey(dateOfWeekdayThisWeek(day.day, now));
    const total = day.rest ? 0 : day.exercises.length;
    let finished = 0;
    let skipped = 0;
    if (!day.rest) {
      for (const exercise of day.exercises) {
        const progress = getExerciseProgress(
          state,
          date,
          day.day,
          plan.createdAt,
          exercise.exerciseId,
          exercise.sets,
        );
        if (progress.skipped) skipped += 1;
        if (progress.finished) finished += 1;
      }
    }
    return {
      weekday: day.day,
      rest: day.rest,
      date,
      isToday: date === today,
      total,
      finished,
      skipped,
    };
  });
}

export function statsSince(
  state: SessionLogState,
  sinceIso: string,
  until = new Date(),
): SessionPeriodStats {
  const since = Date.parse(sinceIso);
  const untilMs = until.getTime();
  const trainingDates = new Set<string>();
  let finishedExercises = 0;
  let skippedExercises = 0;

  for (const day of state.days) {
    for (const exercise of day.exercises) {
      const stamps = exercise.sets.map((item) => Date.parse(item.at));
      const inWindow = stamps.some(
        (stamp) => Number.isFinite(stamp) && stamp >= since && stamp <= untilMs,
      );
      if (!inWindow && exercise.sets.length > 0) continue;
      if (!inWindow && !exercise.skipped) continue;
      if (exercise.skipped) {
        skippedExercises += 1;
        trainingDates.add(day.date);
        continue;
      }
      if (exercise.sets.some((item) => item.status === "done")) {
        finishedExercises += 1;
        trainingDates.add(day.date);
      }
    }
  }

  return {
    trainingDays: trainingDates.size,
    finishedExercises,
    skippedExercises,
  };
}
