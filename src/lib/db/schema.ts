import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  secondaryMuscles: text("secondary_muscles").notNull(),
  equipment: text("equipment").notNull(),
  difficulty: text("difficulty").notNull(),
  motion: text("motion").notNull(),
  description: text("description").notNull(),
  steps: text("steps").notNull(),
  commonMistake: text("common_mistake").notNull(),
  analyzable: integer("analyzable", { mode: "boolean" }).notNull(),
  analysisProfile: text("analysis_profile"),
  cameraView: text("camera_view").notNull(),
  sortOrder: integer("sort_order").notNull(),
  videoId: text("video_id").notNull(),
  videoSource: text("video_source").notNull(),
  videoUrl: text("video_url").notNull(),
});

export type ExerciseRow = typeof exercises.$inferSelect;
