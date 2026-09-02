/**
 * Grafo explícito de substituição. A ordem em cada lista é a prioridade.
 * O motor só oferece o que passa no filtro de equipamento, nível e músculo.
 */
export const SUBSTITUTION_GRAPH: Record<string, string[]> = {
  "push-up": ["incline-push-up", "knee-push-up", "floor-dumbbell-press"],
  "incline-push-up": ["push-up", "knee-push-up"],
  "knee-push-up": ["incline-push-up", "push-up"],
  "bench-press": [
    "incline-dumbbell-press",
    "floor-dumbbell-press",
    "push-up",
  ],
  "incline-dumbbell-press": ["floor-dumbbell-press", "push-up"],
  "floor-dumbbell-press": ["push-up", "incline-dumbbell-press"],
  "pull-up": ["lat-pulldown", "inverted-row", "dumbbell-row", "superman"],
  "barbell-row": ["dumbbell-row", "inverted-row", "superman"],
  "lat-pulldown": ["pull-up", "inverted-row", "superman"],
  "inverted-row": ["dumbbell-row", "superman", "barbell-row"],
  "dumbbell-row": ["inverted-row", "barbell-row", "superman"],
  superman: ["inverted-row", "dead-bug"],
  "shoulder-press": ["pike-push-up", "lateral-raise"],
  "lateral-raise": ["shoulder-press", "pike-push-up"],
  "pike-push-up": ["shoulder-press", "push-up"],
  "face-pull": ["superman", "inverted-row"],
  "barbell-curl": ["hammer-curl", "towel-curl"],
  "hammer-curl": ["barbell-curl", "towel-curl"],
  "towel-curl": ["hammer-curl", "inverted-row"],
  "bench-dip": ["diamond-push-up", "dumbbell-tricep-extension", "triceps-pushdown"],
  "triceps-pushdown": [
    "dumbbell-tricep-extension",
    "diamond-push-up",
    "bench-dip",
  ],
  "diamond-push-up": ["bench-dip", "push-up", "dumbbell-tricep-extension"],
  "dumbbell-tricep-extension": ["diamond-push-up", "triceps-pushdown"],
  "bodyweight-squat": ["goblet-squat", "reverse-lunge", "leg-press"],
  "goblet-squat": ["bodyweight-squat", "reverse-lunge"],
  "reverse-lunge": ["bodyweight-squat", "goblet-squat"],
  "leg-press": ["goblet-squat", "bodyweight-squat"],
  "romanian-deadlift": ["glute-bridge", "single-leg-glute-bridge"],
  "hip-thrust": ["glute-bridge", "single-leg-glute-bridge"],
  "glute-bridge": ["single-leg-glute-bridge", "hip-thrust"],
  "single-leg-glute-bridge": ["glute-bridge", "hip-thrust"],
  plank: ["dead-bug", "crunch"],
  "dead-bug": ["plank", "crunch"],
  crunch: ["plank", "dead-bug"],
  "standing-calf-raise": ["bodyweight-squat"],
};

export function graphAlternatives(exerciseId: string): string[] {
  return SUBSTITUTION_GRAPH[exerciseId] ?? [];
}
