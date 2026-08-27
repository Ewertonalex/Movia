export type MuscleGroup =
  | "Peito"
  | "Costas"
  | "Ombros"
  | "Bíceps"
  | "Tríceps"
  | "Quadríceps"
  | "Glúteos e posterior"
  | "Core"
  | "Panturrilhas";

export type Difficulty = "Iniciante" | "Intermediário" | "Avançado";

export type AnalysisProfile = "squat" | "pushup" | "curl" | "lunge";

export type CameraView = "Lateral" | "Frontal" | "Frontal ou lateral";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: Difficulty;
  motion: string;
  description: string;
  steps: [string, string, string];
  commonMistake: string;
  analyzable: boolean;
  analysisProfile: AnalysisProfile | null;
  cameraView: CameraView;
  sortOrder: number;
  videoId: string;
  videoSource: string;
  videoUrl: string;
}

export type Surface = "exercises" | "routine" | "analyze" | "about";

export type Severity = "atencao" | "ajuste" | "ok";

export type ConfidenceLabel = "Alta" | "Boa" | "Limitada";

export interface Finding {
  id: string;
  title: string;
  detail: string;
  cue: string;
  severity: Severity;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  cycleIndex: number;
  timestamp: number;
}

export interface CycleResult {
  index: number;
  startTime: number;
  bottomTime: number;
  endTime: number;
  duration: number;
  minAngle: number;
  maxAngle: number;
  score: number;
  findingIds: string[];
}

export interface PoseFrame {
  time: number;
  quality: number;
  landmarks: { x: number; y: number; visibility: number }[];
}

export interface AnalysisResult {
  profile: AnalysisProfile;
  cameraView: "lateral" | "frontal";
  cycles: CycleResult[];
  findings: Finding[];
  consistency: number;
  frames: PoseFrame[];
  sampledFrames: number;
  validFrames: number;
  durationSeconds: number;
  demo?: boolean;
}

export type PlannerGoal =
  | "Hipertrofia"
  | "Força"
  | "Condicionamento"
  | "Saúde e constância";

export type PlannerLevel = "Iniciante" | "Intermediário" | "Avançado";

export type WeekdayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export interface PlannerInput {
  heightCm: number;
  weightKg: number;
  goal: PlannerGoal;
  level: PlannerLevel;
  minutes: number;
  days: WeekdayKey[];
  muscles: MuscleGroup[];
}

export interface PlannedExercise {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  sets: number;
  reps: string;
  restSeconds: number;
  analyzable: boolean;
}

export interface PlannedDay {
  day: WeekdayKey;
  label: string;
  rest: boolean;
  sessionLabel?: string;
  focus?: MuscleGroup[];
  minutes?: number;
  exercises: PlannedExercise[];
}

export interface WeeklyPlan {
  createdAt: string;
  input: PlannerInput;
  rotation: number;
  days: PlannedDay[];
}
