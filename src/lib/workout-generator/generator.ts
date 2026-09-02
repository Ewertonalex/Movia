import { EXERCISE_CATALOG, getExerciseById, MUSCLE_GROUPS } from "@/lib/catalog";
import {
  generateWeeklyPlan,
  PLANNER_DEFAULTS,
} from "@/lib/planner/plan";
import type {
  Exercise,
  PlannedExercise,
  PlannerGoal,
  PlannerInput,
  WeekdayKey,
  WeeklyPlan,
} from "@/lib/types";
import {
  allowedForLevel,
  constrainCatalog,
  isDirectlyAvailable,
  resolveForEquipment,
} from "./availability";
import { resolveEquipmentSelection } from "./defaults";
import { graphAlternatives } from "./substitution-graph";
import type { QuickStartGoal, QuickStartInput } from "./types";

const GOAL_MAP: Record<QuickStartGoal, PlannerGoal> = {
  Hipertrofia: "Hipertrofia",
  Emagrecimento: "Condicionamento",
  "Ganho de força": "Força",
  Resistência: "Condicionamento",
  "Condicionamento físico": "Condicionamento",
  Mobilidade: "Saúde e constância",
  "Saúde e bem-estar": "Saúde e constância",
  Manutenção: "Saúde e constância",
};

const DAYS_BY_FREQUENCY: WeekdayKey[][] = [
  ["seg"],
  ["seg", "qui"],
  ["seg", "qua", "sex"],
  ["seg", "ter", "qui", "sex"],
  ["seg", "ter", "qua", "qui", "sex"],
  ["seg", "ter", "qua", "qui", "sex", "sab"],
  ["seg", "ter", "qua", "qui", "sex", "sab", "dom"],
];

export function mapQuickStartGoal(goal: QuickStartGoal): PlannerGoal {
  return GOAL_MAP[goal];
}

export function daysForFrequency(daysPerWeek: number): WeekdayKey[] {
  const clamped = Math.min(7, Math.max(1, Math.round(daysPerWeek)));
  return DAYS_BY_FREQUENCY[clamped - 1];
}

export function toPlannerInput(input: QuickStartInput): PlannerInput {
  const equipment = resolveEquipmentSelection(
    input.equipment,
    input.unknownEquipment,
  );
  return {
    ...PLANNER_DEFAULTS,
    sex: input.sex,
    goal: mapQuickStartGoal(input.goal),
    level: input.level,
    minutes: input.minutes === 75 ? 75 : input.minutes,
    days: daysForFrequency(input.daysPerWeek),
    muscles: input.fullBody ? [...MUSCLE_GROUPS] : [...input.muscles],
    location: input.location,
    equipment,
  };
}

/**
 * Motor único: filtra o catálogo e delega a geração determinística já usada
 * pelo planejador semanal. Sem equipamento definido, o comportamento histórico
 * permanece intacto.
 */
export function generateEquipmentAwarePlan(
  input: PlannerInput,
  catalog: Exercise[] = EXERCISE_CATALOG,
  rotation = 0,
): WeeklyPlan {
  const resolved: PlannerInput = {
    ...input,
    equipment: input.equipmentUnknown ? [] : input.equipment,
  };
  const filtered = constrainCatalog(
    catalog,
    resolved.location,
    resolved.equipment,
  );
  return generateWeeklyPlan(resolved, filtered, rotation);
}

export function listSwapOptions(
  exercise: PlannedExercise,
  input: PlannerInput,
  catalog: Exercise[],
  usedIds: string[],
): Exercise[] {
  const used = new Set(usedIds);
  const origin = getExerciseById(exercise.exerciseId, catalog);
  if (!origin) return [];

  const ids = [
    ...graphAlternatives(exercise.exerciseId),
    ...(origin.equipmentAlternatives ?? []).map((item) => item.substituteExerciseId),
  ];

  const seen = new Set<string>();
  const options: Exercise[] = [];
  for (const id of ids) {
    if (id === exercise.exerciseId || used.has(id) || seen.has(id)) continue;
    seen.add(id);
    const candidate = getExerciseById(id, catalog);
    if (!candidate) continue;
    if (candidate.muscleGroup !== origin.muscleGroup) continue;
    if (!allowedForLevel(candidate, input.level)) continue;
    if (input.location && candidate.locationCompatible?.length) {
      if (!candidate.locationCompatible.includes(input.location)) continue;
    }
    if (
      input.equipment !== undefined &&
      !isDirectlyAvailable(candidate, input.equipment)
    ) {
      continue;
    }
    options.push(candidate);
  }
  return options;
}

export function swapExerciseInPlan(
  plan: WeeklyPlan,
  day: WeekdayKey,
  fromId: string,
  toId: string,
  catalog: Exercise[],
): WeeklyPlan {
  const next = getExerciseById(toId, catalog);
  if (!next) return plan;

  return {
    ...plan,
    days: plan.days.map((item) => {
      if (item.day !== day) return item;
      const exercises = item.exercises.map((exercise) =>
        exercise.exerciseId === fromId
          ? {
              ...exercise,
              exerciseId: next.id,
              name: next.name,
              muscleGroup: next.muscleGroup,
              equipment: next.equipment,
              analyzable: next.analyzable,
            }
          : exercise,
      );
      return {
        ...item,
        exercises,
        focus: Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup))),
      };
    }),
  };
}

/** Sugestão estática de progressão — ponto de extensão para adaptação futura. */
export function progressionHint(input: PlannerInput): string {
  const bodyweight = input.equipment !== undefined && input.equipment.length === 0;
  if (!bodyweight) {
    return "Quando o movimento ficar confortável, considere um pequeno aumento de carga na série seguinte — sem pressa e sem ignorar desconforto persistente.";
  }
  return "Semana 1: prescrição atual. Semana 2: tente 2 repetições a mais. Semana 3: acrescente uma pausa de 1 s na parte mais baixa. Semana 4: uma variação unilateral do mesmo padrão, se o movimento continuar confortável.";
}

export { resolveForEquipment };
