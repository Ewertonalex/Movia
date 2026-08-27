import type { WeeklyPlan } from "@/lib/types";

export const PLAN_STORAGE_KEY = "movia-weekly-plan-v1";
/** Chave usada nas primeiras versões do produto, lida apenas para migração. */
export const LEGACY_PLAN_STORAGE_KEY = "form-weekly-plan-v1";

function isWeeklyPlan(value: unknown): value is WeeklyPlan {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<WeeklyPlan>;
  return (
    typeof candidate.createdAt === "string" &&
    Array.isArray(candidate.days) &&
    typeof candidate.input === "object" &&
    candidate.input !== null
  );
}

export function loadStoredPlan(): WeeklyPlan | null {
  if (typeof window === "undefined") return null;
  for (const key of [PLAN_STORAGE_KEY, LEGACY_PLAN_STORAGE_KEY]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (isWeeklyPlan(parsed)) {
        return { ...parsed, rotation: parsed.rotation ?? 0 };
      }
    } catch {
      // chave corrompida: seguimos para a próxima
    }
  }
  return null;
}

export function saveStoredPlan(plan: WeeklyPlan): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // armazenamento indisponível (modo privado, cota cheia): plano segue em memória
  }
}

const listeners = new Set<() => void>();
let snapshot: WeeklyPlan | null | undefined;

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToPlan(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPlanSnapshot(): WeeklyPlan | null {
  if (snapshot === undefined) snapshot = loadStoredPlan();
  return snapshot;
}

/** No servidor não existe plano salvo: a hidratação parte sempre de vazio. */
export function getServerPlanSnapshot(): WeeklyPlan | null {
  return null;
}

export function publishPlan(plan: WeeklyPlan): void {
  snapshot = plan;
  saveStoredPlan(plan);
  emit();
}

export function clearStoredPlan(): void {
  snapshot = null;
  emit();
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PLAN_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_PLAN_STORAGE_KEY);
  } catch {
    // nada a fazer
  }
}
