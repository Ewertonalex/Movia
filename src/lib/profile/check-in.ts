import type { CheckInFeeling, PlannerLevel, WeeklyPlan } from "@/lib/types";

/** Dois meses civis aproximados: 60 dias. */
export const CHECK_IN_DAYS = 60;
export const CHECK_IN_MS = CHECK_IN_DAYS * 24 * 60 * 60 * 1000;

export function nextPlannerLevel(level: PlannerLevel): PlannerLevel {
  if (level === "Iniciante") return "Intermediário";
  if (level === "Intermediário") return "Avançado";
  return "Avançado";
}

export function canRaiseLevel(level: PlannerLevel): boolean {
  return level !== "Avançado";
}

/** Sobe de nível só se ainda houver degrau e o treino não estiver pesado. */
export function shouldSuggestRaise(
  level: PlannerLevel,
  feeling: CheckInFeeling | null,
): boolean {
  return canRaiseLevel(level) && feeling !== "dificil";
}

export function isCheckInDue(plan: WeeklyPlan, now = new Date()): boolean {
  const answered = plan.checkIn?.answeredAt
    ? Date.parse(plan.checkIn.answeredAt)
    : Number.NaN;
  if (Number.isFinite(answered)) {
    return now.getTime() - answered >= CHECK_IN_MS;
  }
  const started = Date.parse(plan.createdAt);
  if (!Number.isFinite(started)) return false;
  return now.getTime() - started >= CHECK_IN_MS;
}
