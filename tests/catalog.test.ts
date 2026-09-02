import { describe, expect, it } from "vitest";
import { EXERCISE_CATALOG, MUSCLE_GROUPS, CORE_EXERCISES, getExerciseById } from "@/lib/catalog";
import { reconcileWithCatalog } from "@/lib/db/reconcile";
import { ANALYSIS_PROFILES } from "@/lib/analysis/profiles";
import { SUBSTITUTION_GRAPH } from "@/lib/workout-generator/substitution-graph";
import type { Exercise } from "@/lib/types";

describe("catálogo de exercícios", () => {
  it("tem os 23 exercícios originais e amplia o catálogo sem remover nenhum", () => {
    expect(CORE_EXERCISES).toHaveLength(23);
    expect(EXERCISE_CATALOG.length).toBeGreaterThan(23);
    expect(MUSCLE_GROUPS).toHaveLength(9);
    const groups = new Set(EXERCISE_CATALOG.map((item) => item.muscleGroup));
    expect(groups.size).toBe(9);
    for (const group of groups) {
      expect(MUSCLE_GROUPS).toContain(group);
    }
    for (const original of CORE_EXERCISES) {
      expect(EXERCISE_CATALOG.some((item) => item.id === original.id)).toBe(true);
    }
  });

  it("amplia a biblioteca com extras em todos os grupos musculares", () => {
    const extras = EXERCISE_CATALOG.filter(
      (item) => !CORE_EXERCISES.some((original) => original.id === item.id),
    );
    expect(extras.length).toBeGreaterThanOrEqual(30);
    const extraGroups = new Set(extras.map((item) => item.muscleGroup));
    expect(extraGroups.size).toBe(MUSCLE_GROUPS.length);
    for (const group of MUSCLE_GROUPS) {
      expect(extraGroups.has(group), group).toBe(true);
    }
  });

  it("marca exatamente quatro exercícios com análise por vídeo", () => {
    const analyzable = EXERCISE_CATALOG.filter((item) => item.analyzable);
    expect(analyzable.map((item) => item.id).sort()).toEqual([
      "barbell-curl",
      "bodyweight-squat",
      "push-up",
      "reverse-lunge",
    ]);
    for (const exercise of analyzable) {
      expect(exercise.analysisProfile).not.toBeNull();
    }
    for (const extra of EXERCISE_CATALOG.filter(
      (item) => !CORE_EXERCISES.some((original) => original.id === item.id),
    )) {
      expect(extra.analyzable, extra.id).toBe(false);
      expect(extra.analysisProfile, extra.id).toBeNull();
    }
  });

  it("mantém ids e ordem de exibição únicos", () => {
    const ids = new Set(EXERCISE_CATALOG.map((item) => item.id));
    const orders = new Set(EXERCISE_CATALOG.map((item) => item.sortOrder));
    expect(ids.size).toBe(EXERCISE_CATALOG.length);
    expect(orders.size).toBe(EXERCISE_CATALOG.length);
  });

  it("só aponta substituições para exercícios que existem no catálogo", () => {
    const ids = new Set(EXERCISE_CATALOG.map((item) => item.id));
    for (const [origin, alternatives] of Object.entries(SUBSTITUTION_GRAPH)) {
      expect(ids.has(origin), origin).toBe(true);
      for (const alternative of alternatives) {
        expect(ids.has(alternative), `${origin} → ${alternative}`).toBe(true);
      }
    }
  });

  it("preenche todos os campos obrigatórios do modelo", () => {
    for (const exercise of EXERCISE_CATALOG) {
      expect(exercise.name.length).toBeGreaterThan(2);
      expect(exercise.description.length).toBeGreaterThan(10);
      expect(exercise.steps).toHaveLength(3);
      expect(exercise.steps.every((step) => step.length > 5)).toBe(true);
      expect(exercise.commonMistake.length).toBeGreaterThan(10);
      expect(exercise.secondaryMuscles.length).toBeGreaterThan(0);
      expect(exercise.equipmentRequired.length).toBeGreaterThan(0);
      expect(exercise.locationCompatible.length).toBeGreaterThan(0);
      expect(["Iniciante", "Intermediário", "Avançado"]).toContain(
        exercise.difficulty,
      );
      expect(["Lateral", "Frontal", "Frontal ou lateral"]).toContain(
        exercise.cameraView,
      );
    }
  });

  it("liga cada perfil de análise a um exercício de referência existente", () => {
    for (const profile of ANALYSIS_PROFILES) {
      const reference = getExerciseById(profile.referenceExerciseId);
      expect(reference, profile.id).toBeDefined();
      expect(reference?.analysisProfile).toBe(profile.id);
    }
  });
});

describe("fallback do banco de dados", () => {
  it("faz o catálogo embutido prevalecer sobre vídeo e análise desatualizados", () => {
    const stale: Exercise[] = EXERCISE_CATALOG.map((exercise) => ({
      ...exercise,
      videoId: "obsoleto",
      videoUrl: "https://www.youtube.com/watch?v=obsoleto",
      analyzable: false,
      analysisProfile: null,
    }));

    const merged = reconcileWithCatalog(stale);
    const squat = merged.find((item) => item.id === "bodyweight-squat");

    expect(merged).toHaveLength(EXERCISE_CATALOG.length);
    expect(squat?.videoId).toBe("l83R5PblSMA");
    expect(squat?.analyzable).toBe(true);
    expect(squat?.analysisProfile).toBe("squat");
  });

  it("preserva conteúdo editorial vindo do banco", () => {
    const stored: Exercise[] = EXERCISE_CATALOG.map((exercise) => ({
      ...exercise,
      description: `${exercise.description} (revisado)`,
    }));

    const merged = reconcileWithCatalog(stored);
    expect(merged[0].description.endsWith("(revisado)")).toBe(true);
  });

  it("devolve os exercícios ordenados", () => {
    const shuffled = [...EXERCISE_CATALOG].reverse();
    const merged = reconcileWithCatalog(shuffled);
    const orders = merged.map((item) => item.sortOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
