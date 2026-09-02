import { describe, expect, it } from "vitest";
import { EXERCISE_CATALOG, getExerciseById } from "@/lib/catalog";
import { PLANNER_DEFAULTS, generateWeeklyPlan } from "@/lib/planner/plan";
import { isDirectlyAvailable } from "@/lib/workout-generator/availability";
import { resolveEquipmentSelection } from "@/lib/workout-generator/defaults";
import {
  daysForFrequency,
  generateEquipmentAwarePlan,
  listSwapOptions,
  mapQuickStartGoal,
  swapExerciseInPlan,
  toPlannerInput,
} from "@/lib/workout-generator/generator";
import type { PlannerInput } from "@/lib/types";
import type { QuickStartInput } from "@/lib/workout-generator/types";

const base: PlannerInput = PLANNER_DEFAULTS;

function plannedIds(input: PlannerInput) {
  return generateEquipmentAwarePlan(input)
    .days.filter((day) => !day.rest)
    .flatMap((day) => day.exercises.map((exercise) => exercise.exerciseId));
}

describe("defaults de equipamento", () => {
  it("assume nenhum equipamento quando o usuário não sabe", () => {
    expect(resolveEquipmentSelection(["halteres", "banco"], true)).toEqual([]);
    expect(resolveEquipmentSelection(["nenhum"], false)).toEqual([]);
    expect(resolveEquipmentSelection(["halteres", "banco"], false)).toEqual([
      "halteres",
      "banco",
    ]);
  });
});

describe("mapeamento do wizard rápido", () => {
  it("traduz objetivos extras para os quatro objetivos do planejador", () => {
    expect(mapQuickStartGoal("Hipertrofia")).toBe("Hipertrofia");
    expect(mapQuickStartGoal("Ganho de força")).toBe("Força");
    expect(mapQuickStartGoal("Emagrecimento")).toBe("Condicionamento");
    expect(mapQuickStartGoal("Saúde e bem-estar")).toBe("Saúde e constância");
  });

  it("distribui 1 a 7 dias de forma determinística", () => {
    expect(daysForFrequency(1)).toEqual(["seg"]);
    expect(daysForFrequency(3)).toEqual(["seg", "qua", "sex"]);
    expect(daysForFrequency(7)).toHaveLength(7);
  });

  it("reaproveita os defaults físicos do planejador", () => {
    const input: QuickStartInput = {
      sex: "Feminino",
      goal: "Hipertrofia",
      level: "Iniciante",
      location: "casa",
      equipment: [],
      unknownEquipment: true,
      muscles: ["Glúteos e posterior", "Quadríceps"],
      fullBody: false,
      minutes: 30,
      daysPerWeek: 3,
    };
    const mapped = toPlannerInput(input);
    expect(mapped.heightCm).toBe(PLANNER_DEFAULTS.heightCm);
    expect(mapped.weightKg).toBe(PLANNER_DEFAULTS.weightKg);
    expect(mapped.equipment).toEqual([]);
    expect(mapped.location).toBe("casa");
  });
});

describe("motor único", () => {
  it("sem local e sem equipamento gera o mesmo plano clássico", () => {
    const classic = generateWeeklyPlan(base);
    const wrapped = generateEquipmentAwarePlan(base);
    expect(wrapped.days).toEqual(classic.days);
  });

  it("gera treino só com peso corporal quando não há equipamento", () => {
    const ids = plannedIds({
      ...base,
      location: "casa",
      equipment: [],
      muscles: ["Peito", "Quadríceps", "Glúteos e posterior", "Abdômen"],
    });
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const exercise = getExerciseById(id);
      expect(exercise, id).toBeDefined();
      expect(isDirectlyAvailable(exercise!, [])).toBe(true);
    }
  });

  it('"não sei" é equivalente a nenhum equipamento', () => {
    const none = plannedIds({
      ...base,
      location: "casa",
      equipment: [],
      muscles: ["Peito", "Costas"],
    });
    const unknown = plannedIds({
      ...base,
      location: "casa",
      equipment: ["halteres"],
      equipmentUnknown: true,
      muscles: ["Peito", "Costas"],
    });
    expect(unknown).toEqual(none);
  });

  it("substitui exercício que exige banco quando o banco falta", () => {
    const ids = plannedIds({
      ...base,
      location: "casa",
      equipment: ["halteres"],
      muscles: ["Peito"],
      days: ["seg", "qua"],
    });
    expect(ids).not.toContain("bench-press");
    expect(ids).not.toContain("incline-dumbbell-press");
    expect(
      ids.some((id) =>
        [
          "push-up",
          "floor-dumbbell-press",
          "incline-push-up",
          "knee-push-up",
        ].includes(id),
      ),
    ).toBe(true);
  });

  it("respeita o tempo informado", () => {
    const short = generateEquipmentAwarePlan({
      ...base,
      minutes: 20,
      location: "casa",
      equipment: [],
    });
    for (const day of short.days.filter((item) => !item.rest)) {
      expect(day.exercises.length).toBeLessThanOrEqual(2);
      expect(day.minutes).toBe(20);
    }
  });

  it("respeita a frequência informada", () => {
    const plan = generateEquipmentAwarePlan({
      ...base,
      days: daysForFrequency(5),
      location: "casa",
      equipment: [],
    });
    expect(plan.days.filter((day) => !day.rest)).toHaveLength(5);
  });

  it("é determinístico", () => {
    const input: PlannerInput = {
      ...base,
      location: "casa",
      equipment: ["halteres"],
    };
    expect(generateEquipmentAwarePlan(input).days).toEqual(
      generateEquipmentAwarePlan(input).days,
    );
  });
});

describe("grafo de substituição", () => {
  it("oferece alternativas do mesmo grupo, com o equipamento disponível", () => {
    const plan = generateEquipmentAwarePlan({
      ...base,
      location: "casa",
      equipment: [],
      muscles: ["Peito"],
      days: ["seg", "qua"],
    });
    const current = {
      exerciseId: "push-up",
      name: "Flexão de braço",
      muscleGroup: "Peito" as const,
      equipment: "Peso corporal",
      sets: 2,
      reps: "8–12",
      restSeconds: 75,
      analyzable: true,
    };
    const options = listSwapOptions(current, plan.input, EXERCISE_CATALOG, []);
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.muscleGroup).toBe(current.muscleGroup);
      expect(isDirectlyAvailable(option, [])).toBe(true);
      expect(option.analyzable).toBe(option.analysisProfile !== null);
    }
    const names = options.map((item) => item.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Flexão inclinada",
        "Flexão com joelhos apoiados",
      ]),
    );
  });

  it("troca o exercício no plano sem alterar os demais dias", () => {
    const plan = generateEquipmentAwarePlan({
      ...base,
      location: "casa",
      equipment: [],
      muscles: ["Peito"],
      days: ["seg", "qua"],
      minutes: 20,
    });
    const day = plan.days.find((item) => !item.rest)!;
    const from = day.exercises[0];
    const options = listSwapOptions(
      from,
      plan.input,
      EXERCISE_CATALOG,
      day.exercises.slice(1).map((item) => item.exerciseId),
    );
    expect(options.length).toBeGreaterThan(0);
    const next = swapExerciseInPlan(
      plan,
      day.day,
      from.exerciseId,
      options[0].id,
      EXERCISE_CATALOG,
    );
    const updated = next.days.find((item) => item.day === day.day)!;
    expect(updated.exercises[0].exerciseId).toBe(options[0].id);
    expect(updated.exercises[0].analyzable).toBe(options[0].analyzable);
  });
});
