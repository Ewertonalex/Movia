import { EXERCISE_CATALOG } from "@/lib/catalog";
import type {
  Exercise,
  MuscleGroup,
  PlanAdjustment,
  PlannedDay,
  PlannedExercise,
  PlannerGoal,
  PlannerInput,
  PlannerLevel,
  PlannerSex,
  WeekdayKey,
  WeeklyPlan,
} from "@/lib/types";
import { formatRest } from "@/lib/utils";
import {
  constrainCatalog,
  resolveForEquipment,
} from "@/lib/workout-generator/availability";

export const WEEKDAYS: { key: WeekdayKey; label: string; full: string }[] = [
  { key: "seg", label: "SEG", full: "Segunda-feira" },
  { key: "ter", label: "TER", full: "Terça-feira" },
  { key: "qua", label: "QUA", full: "Quarta-feira" },
  { key: "qui", label: "QUI", full: "Quinta-feira" },
  { key: "sex", label: "SEX", full: "Sexta-feira" },
  { key: "sab", label: "SÁB", full: "Sábado" },
  { key: "dom", label: "DOM", full: "Domingo" },
];

export const GOALS: PlannerGoal[] = [
  "Hipertrofia",
  "Força",
  "Condicionamento",
  "Saúde e constância",
];

export const LEVELS: PlannerLevel[] = [
  "Iniciante",
  "Intermediário",
  "Avançado",
];

export const SEXES: PlannerSex[] = [
  "Masculino",
  "Feminino",
  "Prefiro não informar",
];

export const SESSION_MINUTES = [30, 45, 60, 75];

export const MUSCLE_BUNDLES: MuscleGroup[][] = [
  ["Peito", "Ombros", "Tríceps"],
  ["Costas", "Bíceps"],
  ["Quadríceps", "Glúteos e posterior", "Panturrilhas"],
  ["Abdômen"],
];

export interface Prescription {
  reps: string;
  restSeconds: number;
}

/** Referência padrão do produto, também usada por quem prefere não informar o sexo. */
export const GOAL_PRESCRIPTION: Record<PlannerGoal, Prescription> = {
  Hipertrofia: { reps: "8–12", restSeconds: 75 },
  Força: { reps: "5–8", restSeconds: 120 },
  Condicionamento: { reps: "12–15", restSeconds: 45 },
  "Saúde e constância": { reps: "10–12", restSeconds: 60 },
};

/**
 * Calibração feminina. Mulheres apresentam, em média, maior resistência à fadiga
 * e recuperação mais rápida entre séries em cargas submáximas, o que sustenta
 * descansos mais curtos e faixas de repetição um pouco mais altas. O trabalho de
 * força permanece igual, porque os ganhos relativos de força e hipertrofia são
 * equivalentes entre os sexos.
 */
export const FEMALE_GOAL_PRESCRIPTION: Record<PlannerGoal, Prescription> = {
  Hipertrofia: { reps: "10–14", restSeconds: 60 },
  Força: { reps: "5–8", restSeconds: 105 },
  Condicionamento: { reps: "14–18", restSeconds: 35 },
  "Saúde e constância": { reps: "12–15", restSeconds: 45 },
};

const UPPER_BODY: MuscleGroup[] = [
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
];

const MAX_SETS = 5;

export const LEVEL_SETS: Record<PlannerLevel, number> = {
  Iniciante: 2,
  Intermediário: 3,
  Avançado: 4,
};

export const LIMITS = {
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 250 },
  minDays: 2,
  minMuscles: 1,
} as const;

/** Digita só número. Campo vazio vira 0 (a validação pede a faixa depois). */
export function parseMeasureInput(raw: string, maxDigits = 3): number {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, maxDigits);
  return digits === "" ? 0 : Number(digits);
}

export const PLANNER_DEFAULTS: PlannerInput = {
  heightCm: 175,
  weightKg: 75,
  sex: "Prefiro não informar",
  goal: "Hipertrofia",
  level: "Iniciante",
  minutes: 45,
  days: ["seg", "qua", "sex"],
  muscles: [
    "Peito",
    "Costas",
    "Quadríceps",
    "Glúteos e posterior",
    "Ombros",
    "Abdômen",
  ],
};

const SESSION_NAMES = "ABCDEFG".split("");

const MUSCLE_ORDER: Record<MuscleGroup, number> = Object.fromEntries(
  MUSCLE_BUNDLES.flat().map((muscle, index) => [muscle, index]),
) as Record<MuscleGroup, number>;

/** Sem informação de sexo, o plano segue a referência padrão. */
export function usesFemaleCalibration(sex: PlannerSex): boolean {
  return sex === "Feminino";
}

export function prescriptionFor(
  goal: PlannerGoal,
  sex: PlannerSex,
): Prescription {
  return usesFemaleCalibration(sex)
    ? FEMALE_GOAL_PRESCRIPTION[goal]
    : GOAL_PRESCRIPTION[goal];
}

/** Explica em linguagem direta o que o sexo informado mudou no plano. */
export function planAdjustments(input: PlannerInput): PlanAdjustment[] {
  if (!usesFemaleCalibration(input.sex)) {
    const detail =
      input.sex === "Prefiro não informar"
        ? "Sem o sexo informado, a rotina segue a referência padrão do MOVIA, com as faixas de repetição e descanso usadas na maior parte dos programas."
        : "A rotina segue a referência padrão do MOVIA, com as faixas de repetição e descanso usadas na maior parte dos programas.";
    return [{ title: "Prescrição de referência", detail }];
  }

  const standard = GOAL_PRESCRIPTION[input.goal];
  const female = FEMALE_GOAL_PRESCRIPTION[input.goal];
  const adjustments: PlanAdjustment[] = [];

  if (female.restSeconds !== standard.restSeconds) {
    adjustments.push({
      title: `Descanso de ${formatRest(female.restSeconds)} em vez de ${formatRest(standard.restSeconds)}`,
      detail:
        "Em média, mulheres restauram força mais rápido entre séries, então o intervalo menor mantém o desempenho e aumenta a densidade do treino.",
    });
  }

  if (female.reps !== standard.reps) {
    adjustments.push({
      title: `Faixa de ${female.reps} repetições em vez de ${standard.reps}`,
      detail:
        "A maior resistência à fadiga em cargas submáximas permite sustentar mais repetições por série sem perder qualidade de execução.",
    });
  }

  if (input.muscles.some((muscle) => UPPER_BODY.includes(muscle))) {
    adjustments.push({
      title: "Uma série a mais nos exercícios de membros superiores",
      detail:
        "É onde a força inicial média é menor e os ganhos relativos costumam ser maiores, então o volume extra tem mais efeito.",
    });
  }

  return adjustments;
}

export function exercisesPerSession(minutes: number): number {
  if (minutes <= 20) return 2;
  if (minutes <= 35) return 3;
  if (minutes <= 50) return 4;
  if (minutes <= 65) return 5;
  return 6;
}

export function validatePlannerInput(input: PlannerInput): string[] {
  const errors: string[] = [];
  if (
    !Number.isFinite(input.heightCm) ||
    input.heightCm < LIMITS.heightCm.min ||
    input.heightCm > LIMITS.heightCm.max
  ) {
    errors.push(
      `Informe uma altura entre ${LIMITS.heightCm.min} e ${LIMITS.heightCm.max} cm.`,
    );
  }
  if (
    !Number.isFinite(input.weightKg) ||
    input.weightKg < LIMITS.weightKg.min ||
    input.weightKg > LIMITS.weightKg.max
  ) {
    errors.push(
      `Informe um peso entre ${LIMITS.weightKg.min} e ${LIMITS.weightKg.max} kg.`,
    );
  }
  if (input.days.length < LIMITS.minDays) {
    errors.push("Escolha pelo menos dois dias de treino na semana.");
  }
  if (input.muscles.length < LIMITS.minMuscles) {
    errors.push("Escolha pelo menos um grupo muscular.");
  }
  return errors;
}

function allowedForLevel(exercise: Exercise, level: PlannerLevel): boolean {
  if (level === "Iniciante") return exercise.difficulty !== "Avançado";
  return true;
}

function orderedDays(days: WeekdayKey[]): WeekdayKey[] {
  return WEEKDAYS.filter((day) => days.includes(day.key)).map((day) => day.key);
}

function activeBundles(muscles: MuscleGroup[]): MuscleGroup[][] {
  const bundles = MUSCLE_BUNDLES.map((bundle) =>
    bundle.filter((muscle) => muscles.includes(muscle)),
  ).filter((bundle) => bundle.length > 0);

  return bundles.length > 0 ? bundles : [muscles];
}

/**
 * Gera uma semana determinística: mesma entrada produz sempre o mesmo plano.
 */
export function generateWeeklyPlan(
  input: PlannerInput,
  catalog: Exercise[] = EXERCISE_CATALOG,
  rotation = 0,
): WeeklyPlan {
  const days = orderedDays(input.days);
  const bundles = activeBundles(input.muscles);
  const perSession = exercisesPerSession(input.minutes);
  const prescription = prescriptionFor(input.goal, input.sex);
  const baseSets = LEVEL_SETS[input.level];
  const femaleCalibration = usesFemaleCalibration(input.sex);
  /** Sem local/equipamento, devolve o catálogo inteiro — o plano clássico não muda. */
  const workingCatalog = constrainCatalog(
    catalog,
    input.location,
    input.equipment,
  );

  const selectedMuscles = bundles.flat();
  const pool = new Map<MuscleGroup, Exercise[]>();
  for (const muscle of selectedMuscles) {
    const seen = new Set<string>();
    const resolved: Exercise[] = [];
    const sources = workingCatalog
      .filter(
        (exercise) =>
          exercise.muscleGroup === muscle &&
          allowedForLevel(exercise, input.level),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const source of sources) {
      const next = resolveForEquipment(
        source,
        input.equipment,
        catalog,
        seen,
      );
      if (!next) continue;
      seen.add(next.id);
      resolved.push(next);
    }
    pool.set(muscle, resolved);
  }

  const usage = new Map<string, number>();
  const muscleUsage = new Map<MuscleGroup, number>();

  const bundleOfMuscle = new Map<MuscleGroup, number>();
  bundles.forEach((bundle, index) => {
    for (const muscle of bundle) bundleOfMuscle.set(muscle, index);
  });

  /** Com mais blocos do que dias, algum bloco não vira treino principal. */
  const assignedBundles = new Set(
    days.map((_, index) => (index + rotation) % bundles.length),
  );

  /** Nunca repete um exercício no mesmo dia e prioriza o que foi menos usado na semana. */
  const pickExercise = (muscle: MuscleGroup, used: Set<string>) => {
    const available = (pool.get(muscle) ?? []).filter(
      (item) => !used.has(item.id),
    );
    if (available.length === 0) return null;
    return [...available].sort((a, b) => {
      const usageDiff = (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0);
      if (usageDiff !== 0) return usageDiff;
      return a.sortOrder - b.sortOrder;
    })[0];
  };

  const plannedDays: PlannedDay[] = WEEKDAYS.map((weekday) => {
    const isTraining = days.includes(weekday.key);
    if (!isTraining) {
      return {
        day: weekday.key,
        label: weekday.label,
        rest: true,
        exercises: [],
      };
    }

    const bundleIndex =
      (days.indexOf(weekday.key) + rotation) % bundles.length;
    const bundle = bundles[bundleIndex];
    const used = new Set<string>();
    const exercises: PlannedExercise[] = [];

    for (let slot = 0; slot < perSession; slot += 1) {
      let picked: Exercise | null = null;
      for (let attempt = 0; attempt < bundle.length; attempt += 1) {
        const muscle = bundle[(slot + attempt) % bundle.length];
        picked = pickExercise(muscle, used);
        if (picked) break;
      }

      // Bundle esgotado no dia: completa com o músculo escolhido menos treinado.
      if (!picked) {
        const orphanScore = (muscle: MuscleGroup) =>
          assignedBundles.has(bundleOfMuscle.get(muscle) ?? -1) ? 1 : 0;

        const byLeastUsed = [...selectedMuscles].sort((a, b) => {
          const orphanDiff = orphanScore(a) - orphanScore(b);
          if (orphanDiff !== 0) return orphanDiff;
          const usageDiff = (muscleUsage.get(a) ?? 0) - (muscleUsage.get(b) ?? 0);
          return usageDiff !== 0 ? usageDiff : MUSCLE_ORDER[a] - MUSCLE_ORDER[b];
        });
        for (const muscle of byLeastUsed) {
          picked = pickExercise(muscle, used);
          if (picked) break;
        }
      }

      if (!picked) break;

      used.add(picked.id);
      usage.set(picked.id, (usage.get(picked.id) ?? 0) + 1);
      muscleUsage.set(
        picked.muscleGroup,
        (muscleUsage.get(picked.muscleGroup) ?? 0) + 1,
      );

      let sets =
        input.goal === "Força" && slot === 0
          ? Math.max(baseSets, 3)
          : baseSets;

      if (femaleCalibration && UPPER_BODY.includes(picked.muscleGroup)) {
        sets = Math.min(sets + 1, MAX_SETS);
      }

      exercises.push({
        exerciseId: picked.id,
        name: picked.name,
        muscleGroup: picked.muscleGroup,
        equipment: picked.equipment,
        sets,
        reps: prescription.reps,
        restSeconds: prescription.restSeconds,
        analyzable: picked.analyzable,
      });
    }

    const focus = Array.from(
      new Set(exercises.map((exercise) => exercise.muscleGroup)),
    );

    return {
      day: weekday.key,
      label: weekday.label,
      rest: false,
      sessionLabel: `Treino ${SESSION_NAMES[bundleIndex] ?? bundleIndex + 1}`,
      focus,
      minutes: input.minutes,
      exercises,
    };
  });

  return {
    createdAt: new Date().toISOString(),
    input: { ...input, days, muscles: [...input.muscles] },
    rotation,
    adjustments: planAdjustments(input),
    days: plannedDays,
  };
}
