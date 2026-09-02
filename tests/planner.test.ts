import { describe, expect, it } from "vitest";
import { EXERCISE_CATALOG, getExerciseById } from "@/lib/catalog";
import {
  FEMALE_GOAL_PRESCRIPTION,
  GOAL_PRESCRIPTION,
  GOALS,
  PLANNER_DEFAULTS,
  exercisesPerSession,
  generateWeeklyPlan,
  parseMeasureInput,
  planAdjustments,
  prescriptionFor,
  validatePlannerInput,
} from "@/lib/planner/plan";
import { migrateStoredPlan } from "@/lib/planner/storage";
import type { PlannerInput, WeeklyPlan } from "@/lib/types";

const base: PlannerInput = PLANNER_DEFAULTS;

describe("validação do planejador", () => {
  it("aceita os valores padrão", () => {
    expect(validatePlannerInput(base)).toEqual([]);
  });

  it("permite apagar altura e peso sem deixar zero na frente", () => {
    expect(parseMeasureInput("")).toBe(0);
    expect(parseMeasureInput("0")).toBe(0);
    expect(parseMeasureInput("0175")).toBe(175);
    expect(parseMeasureInput("75kg")).toBe(75);
    expect(parseMeasureInput("180")).toBe(180);
  });

  it("recusa altura, peso, dias e músculos fora dos limites", () => {
    const errors = validatePlannerInput({
      ...base,
      heightCm: 90,
      weightKg: 300,
      days: ["seg"],
      muscles: [],
    });
    expect(errors).toHaveLength(4);
  });
});

describe("quantidade de exercícios por duração", () => {
  it("segue as faixas de tempo", () => {
    expect(exercisesPerSession(15)).toBe(2);
    expect(exercisesPerSession(20)).toBe(2);
    expect(exercisesPerSession(30)).toBe(3);
    expect(exercisesPerSession(35)).toBe(3);
    expect(exercisesPerSession(45)).toBe(4);
    expect(exercisesPerSession(60)).toBe(5);
    expect(exercisesPerSession(75)).toBe(6);
  });
});

describe("geração da semana", () => {
  it("cria sete dias, com treino apenas nos dias escolhidos", () => {
    const plan = generateWeeklyPlan(base);
    expect(plan.days).toHaveLength(7);

    const training = plan.days.filter((day) => !day.rest);
    expect(training.map((day) => day.day)).toEqual(["seg", "qua", "sex"]);

    for (const day of plan.days.filter((item) => item.rest)) {
      expect(day.exercises).toHaveLength(0);
    }
  });

  it("respeita séries por nível e prescrição por objetivo", () => {
    const plan = generateWeeklyPlan({
      ...base,
      level: "Intermediário",
      goal: "Condicionamento",
    });
    const exercises = plan.days.flatMap((day) => day.exercises);
    expect(exercises.length).toBeGreaterThan(0);
    for (const exercise of exercises) {
      expect(exercise.sets).toBe(3);
      expect(exercise.reps).toBe(GOAL_PRESCRIPTION.Condicionamento.reps);
      expect(exercise.restSeconds).toBe(
        GOAL_PRESCRIPTION.Condicionamento.restSeconds,
      );
    }
  });

  it("garante ao menos três séries no primeiro exercício quando o objetivo é força", () => {
    const plan = generateWeeklyPlan({
      ...base,
      level: "Iniciante",
      goal: "Força",
    });
    for (const day of plan.days.filter((item) => !item.rest)) {
      expect(day.exercises[0].sets).toBeGreaterThanOrEqual(3);
      for (const exercise of day.exercises.slice(1)) {
        expect(exercise.sets).toBe(2);
      }
    }
  });

  it("nunca prescreve exercício avançado para iniciante", () => {
    const plan = generateWeeklyPlan({
      ...base,
      level: "Iniciante",
      muscles: ["Costas", "Bíceps"],
      days: ["seg", "ter", "qua", "qui"],
      minutes: 75,
    });
    for (const planned of plan.days.flatMap((day) => day.exercises)) {
      const exercise = getExerciseById(planned.exerciseId);
      expect(exercise?.difficulty).not.toBe("Avançado");
    }
  });

  it("libera exercícios avançados para quem já tem experiência", () => {
    const plan = generateWeeklyPlan({
      ...base,
      level: "Avançado",
      muscles: ["Costas"],
      days: ["seg", "qua"],
      minutes: 60,
    });
    const ids = plan.days.flatMap((day) =>
      day.exercises.map((exercise) => exercise.exerciseId),
    );
    expect(ids).toContain("pull-up");
  });

  it("evita repetir exercício antes de usar as alternativas do dia", () => {
    const plan = generateWeeklyPlan({ ...base, minutes: 75 });
    for (const day of plan.days.filter((item) => !item.rest)) {
      const ids = day.exercises.map((exercise) => exercise.exerciseId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("respeita a quantidade de exercícios por sessão quando há catálogo suficiente", () => {
    const plan = generateWeeklyPlan({
      ...base,
      minutes: 45,
      muscles: ["Peito", "Ombros", "Tríceps"],
      days: ["seg", "qui"],
    });
    for (const day of plan.days.filter((item) => !item.rest)) {
      expect(day.exercises).toHaveLength(4);
    }
  });

  it("é determinística para a mesma entrada", () => {
    const first = generateWeeklyPlan(base);
    const second = generateWeeklyPlan(base);
    expect(first.days).toEqual(second.days);
  });

  it("reorganiza a distribuição quando a rotação muda", () => {
    const original = generateWeeklyPlan(base);
    const rotated = generateWeeklyPlan(base, EXERCISE_CATALOG, 1);
    const focusOriginal = original.days
      .filter((day) => !day.rest)
      .map((day) => day.focus?.join("|"));
    const focusRotated = rotated.days
      .filter((day) => !day.rest)
      .map((day) => day.focus?.join("|"));
    expect(focusRotated).not.toEqual(focusOriginal);
  });

  it("mantém rótulos de treino e foco em todos os dias treinados", () => {
    const plan = generateWeeklyPlan(base);
    for (const day of plan.days.filter((item) => !item.rest)) {
      expect(day.sessionLabel).toMatch(/^Treino [A-G]$/);
      expect(day.focus?.length).toBeGreaterThan(0);
      expect(day.minutes).toBe(base.minutes);
    }
  });
});

describe("calibração por sexo", () => {
  const female: PlannerInput = { ...base, sex: "Feminino" };
  const male: PlannerInput = { ...base, sex: "Masculino" };
  const unspecified: PlannerInput = { ...base, sex: "Prefiro não informar" };

  it("usa a referência padrão para masculino e para quem não informa", () => {
    for (const goal of GOALS) {
      expect(prescriptionFor(goal, "Masculino")).toEqual(
        GOAL_PRESCRIPTION[goal],
      );
      expect(prescriptionFor(goal, "Prefiro não informar")).toEqual(
        GOAL_PRESCRIPTION[goal],
      );
    }
  });

  it("gera exatamente o mesmo plano sem informar sexo e no masculino", () => {
    expect(generateWeeklyPlan(unspecified).days).toEqual(
      generateWeeklyPlan(male).days,
    );
  });

  it("encurta o descanso e amplia as repetições no perfil feminino", () => {
    const plan = generateWeeklyPlan(female);
    const expected = FEMALE_GOAL_PRESCRIPTION[female.goal];
    const standard = GOAL_PRESCRIPTION[female.goal];

    expect(expected.restSeconds).toBeLessThan(standard.restSeconds);
    for (const exercise of plan.days.flatMap((day) => day.exercises)) {
      expect(exercise.restSeconds).toBe(expected.restSeconds);
      expect(exercise.reps).toBe(expected.reps);
    }
  });

  it("mantém o descanso da força mais longo que o de hipertrofia", () => {
    expect(FEMALE_GOAL_PRESCRIPTION["Força"].restSeconds).toBeGreaterThan(
      FEMALE_GOAL_PRESCRIPTION.Hipertrofia.restSeconds,
    );
    expect(FEMALE_GOAL_PRESCRIPTION["Força"].reps).toBe(
      GOAL_PRESCRIPTION["Força"].reps,
    );
  });

  it("acrescenta uma série nos membros superiores e preserva os inferiores", () => {
    const input: PlannerInput = {
      ...female,
      level: "Intermediário",
      muscles: ["Peito", "Quadríceps"],
      days: ["seg", "qui"],
      minutes: 45,
    };
    const plan = generateWeeklyPlan(input);
    const reference = generateWeeklyPlan({ ...input, sex: "Masculino" });

    const setsByMuscle = (weekly: typeof plan, muscle: string) =>
      weekly.days
        .flatMap((day) => day.exercises)
        .filter((exercise) => exercise.muscleGroup === muscle)
        .map((exercise) => exercise.sets);

    const upper = setsByMuscle(plan, "Peito");
    const lower = setsByMuscle(plan, "Quadríceps");
    expect(upper.length).toBeGreaterThan(0);
    expect(lower.length).toBeGreaterThan(0);
    expect(upper.every((sets) => sets === 4)).toBe(true);
    expect(lower).toEqual(setsByMuscle(reference, "Quadríceps"));
  });

  it("nunca ultrapassa cinco séries por exercício", () => {
    const plan = generateWeeklyPlan({
      ...female,
      level: "Avançado",
      goal: "Força",
      muscles: ["Peito", "Costas", "Ombros"],
      minutes: 75,
    });
    for (const exercise of plan.days.flatMap((day) => day.exercises)) {
      expect(exercise.sets).toBeLessThanOrEqual(5);
    }
  });

  it("mantém a seleção de exercícios idêntica entre os perfis", () => {
    const idsOf = (input: PlannerInput) =>
      generateWeeklyPlan(input).days.flatMap((day) =>
        day.exercises.map((exercise) => exercise.exerciseId),
      );
    expect(idsOf(female)).toEqual(idsOf(male));
  });

  it("explica os ajustes aplicados e a base de cada perfil", () => {
    const femaleNotes = planAdjustments(female);
    expect(femaleNotes.length).toBeGreaterThanOrEqual(2);
    expect(femaleNotes.map((note) => note.title).join(" ")).toMatch(/Descanso/);

    const unspecifiedNotes = planAdjustments(unspecified);
    expect(unspecifiedNotes).toHaveLength(1);
    expect(unspecifiedNotes[0].detail).toMatch(/Sem o sexo informado/);
  });

  it("continua determinística com o sexo informado", () => {
    expect(generateWeeklyPlan(female).days).toEqual(
      generateWeeklyPlan(female).days,
    );
  });
});

describe("planos salvos antes da calibração", () => {
  it("assume a referência padrão e recria a explicação", () => {
    const legacy = generateWeeklyPlan(base);
    const stored = JSON.parse(
      JSON.stringify({
        ...legacy,
        input: { ...legacy.input, sex: undefined },
        adjustments: undefined,
      }),
    ) as WeeklyPlan;

    const migrated = migrateStoredPlan(stored);
    expect(migrated.input.sex).toBe("Prefiro não informar");
    expect(migrated.adjustments).toHaveLength(1);
    expect(migrated.days).toEqual(legacy.days);
  });

  it("renomeia o grupo Core para Abdômen em planos antigos", () => {
    const legacy = generateWeeklyPlan(base);
    const stored = JSON.parse(
      JSON.stringify({
        ...legacy,
        input: {
          ...legacy.input,
          muscles: legacy.input.muscles.map((muscle) =>
            muscle === "Abdômen" ? "Core" : muscle,
          ),
        },
        days: legacy.days.map((day) => ({
          ...day,
          focus: day.focus?.map((muscle) =>
            muscle === "Abdômen" ? "Core" : muscle,
          ),
          exercises: day.exercises.map((exercise) => ({
            ...exercise,
            muscleGroup:
              exercise.muscleGroup === "Abdômen" ? "Core" : exercise.muscleGroup,
          })),
        })),
      }),
    ) as WeeklyPlan;

    const migrated = migrateStoredPlan(stored);
    expect(migrated.input.muscles).not.toContain("Core");
    expect(migrated.input.muscles).toEqual(legacy.input.muscles);
    expect(
      migrated.days.flatMap((day) =>
        day.exercises.map((exercise) => exercise.muscleGroup),
      ),
    ).not.toContain("Core");
  });
});
