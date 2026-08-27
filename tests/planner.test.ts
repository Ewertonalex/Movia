import { describe, expect, it } from "vitest";
import { EXERCISE_CATALOG, getExerciseById } from "@/lib/catalog";
import {
  GOAL_PRESCRIPTION,
  PLANNER_DEFAULTS,
  exercisesPerSession,
  generateWeeklyPlan,
  validatePlannerInput,
} from "@/lib/planner/plan";
import type { PlannerInput } from "@/lib/types";

const base: PlannerInput = PLANNER_DEFAULTS;

describe("validação do planejador", () => {
  it("aceita os valores padrão", () => {
    expect(validatePlannerInput(base)).toEqual([]);
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
