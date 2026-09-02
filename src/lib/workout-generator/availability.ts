import { getExerciseById } from "@/lib/catalog";
import type {
  EquipmentTag,
  Exercise,
  LocationTag,
  PlannerLevel,
} from "@/lib/types";
import { graphAlternatives } from "./substitution-graph";

export function isDirectlyAvailable(
  exercise: Exercise,
  equipment: EquipmentTag[],
): boolean {
  const required = exercise.equipmentRequired ?? ["nenhum"];
  if (required.length === 1 && required[0] === "nenhum") return true;
  return required.every(
    (tag) => tag === "nenhum" || equipment.includes(tag),
  );
}

export function matchesLocation(
  exercise: Exercise,
  location: LocationTag | undefined,
): boolean {
  if (!location) return true;
  const places = exercise.locationCompatible ?? [];
  if (places.length === 0) return true;
  return places.includes(location);
}

function candidateIds(exercise: Exercise): string[] {
  const fromExercise = (exercise.equipmentAlternatives ?? []).map(
    (item) => item.substituteExerciseId,
  );
  return [...fromExercise, ...graphAlternatives(exercise.id)];
}

export function resolveForEquipment(
  exercise: Exercise,
  equipment: EquipmentTag[] | undefined,
  catalog: Exercise[],
  used: Set<string>,
): Exercise | null {
  if (equipment === undefined) return used.has(exercise.id) ? null : exercise;
  if (!used.has(exercise.id) && isDirectlyAvailable(exercise, equipment)) {
    return exercise;
  }

  for (const id of candidateIds(exercise)) {
    if (used.has(id)) continue;
    const substitute = getExerciseById(id, catalog);
    if (!substitute) continue;
    if (isDirectlyAvailable(substitute, equipment)) return substitute;
  }
  return null;
}

export function canProvideExercise(
  exercise: Exercise,
  equipment: EquipmentTag[] | undefined,
  catalog: Exercise[],
): boolean {
  return resolveForEquipment(exercise, equipment, catalog, new Set()) !== null;
}

export function allowedForLevel(
  exercise: Exercise,
  level: PlannerLevel,
): boolean {
  if (level === "Iniciante") return exercise.difficulty !== "Avançado";
  return true;
}

export function constrainCatalog(
  catalog: Exercise[],
  location: LocationTag | undefined,
  equipment: EquipmentTag[] | undefined,
): Exercise[] {
  if (!location && equipment === undefined) return catalog;
  return catalog.filter(
    (exercise) =>
      matchesLocation(exercise, location) &&
      canProvideExercise(exercise, equipment, catalog),
  );
}
