import "server-only";

import { EXERCISE_CATALOG } from "@/lib/catalog";
import type {
  AnalysisProfile,
  CameraView,
  Difficulty,
  Exercise,
  MuscleGroup,
} from "@/lib/types";
import { reconcileWithCatalog, type CatalogPayload } from "./reconcile";
import type { ExerciseRow } from "./schema";

export type { CatalogPayload, CatalogSource } from "./reconcile";
export { reconcileWithCatalog } from "./reconcile";

const DB_FILE = process.env.MOVIA_DB_FILE ?? "movia.db";

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  secondary_muscles TEXT NOT NULL,
  equipment TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  motion TEXT NOT NULL,
  description TEXT NOT NULL,
  steps TEXT NOT NULL,
  common_mistake TEXT NOT NULL,
  analyzable INTEGER NOT NULL,
  analysis_profile TEXT,
  camera_view TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  video_id TEXT NOT NULL,
  video_source TEXT NOT NULL,
  video_url TEXT NOT NULL
);
`;

function parseJsonArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function rowToExercise(row: ExerciseRow): Exercise {
  const steps = parseJsonArray(row.steps);
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscleGroup as MuscleGroup,
    secondaryMuscles: parseJsonArray(row.secondaryMuscles),
    equipment: row.equipment,
    difficulty: row.difficulty as Difficulty,
    motion: row.motion,
    description: row.description,
    steps: [steps[0] ?? "", steps[1] ?? "", steps[2] ?? ""],
    commonMistake: row.commonMistake,
    analyzable: Boolean(row.analyzable),
    analysisProfile: (row.analysisProfile as AnalysisProfile | null) ?? null,
    cameraView: row.cameraView as CameraView,
    sortOrder: row.sortOrder,
    videoId: row.videoId,
    videoSource: row.videoSource,
    videoUrl: row.videoUrl,
    equipmentRequired: ["nenhum"],
    locationCompatible: ["casa", "academia", "ar_livre", "outro"],
  };
}

let cached: CatalogPayload | null = null;

export async function loadCatalog(): Promise<CatalogPayload> {
  if (cached) return cached;

  const useSqlite = process.env.MOVIA_USE_SQLITE === "1";

  if (!useSqlite) {
    cached = { exercises: EXERCISE_CATALOG, source: "catalog" };
    return cached;
  }

  try {
    const [{ default: Database }, { drizzle }, schema] = await Promise.all([
      import("better-sqlite3"),
      import("drizzle-orm/better-sqlite3"),
      import("./schema"),
    ]);

    const sqlite = new Database(DB_FILE);
    sqlite.pragma("journal_mode = WAL");
    sqlite.exec(CREATE_TABLE_SQL);

    const db = drizzle(sqlite, { schema });
    const existing = db.select().from(schema.exercises).all();

    if (existing.length === 0) {
      db.insert(schema.exercises)
        .values(
          EXERCISE_CATALOG.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            secondaryMuscles: JSON.stringify(exercise.secondaryMuscles),
            equipment: exercise.equipment,
            difficulty: exercise.difficulty,
            motion: exercise.motion,
            description: exercise.description,
            steps: JSON.stringify(exercise.steps),
            commonMistake: exercise.commonMistake,
            analyzable: exercise.analyzable,
            analysisProfile: exercise.analysisProfile,
            cameraView: exercise.cameraView,
            sortOrder: exercise.sortOrder,
            videoId: exercise.videoId,
            videoSource: exercise.videoSource,
            videoUrl: exercise.videoUrl,
          })),
        )
        .run();
    }

    const rows = db.select().from(schema.exercises).all();
    sqlite.close();

    cached = {
      exercises: reconcileWithCatalog(rows.map(rowToExercise)),
      source: "database",
    };
    return cached;
  } catch {
    cached = { exercises: EXERCISE_CATALOG, source: "catalog" };
    return cached;
  }
}
