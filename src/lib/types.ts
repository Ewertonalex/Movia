export type MuscleGroup =
  | "Peito"
  | "Costas"
  | "Ombros"
  | "Bíceps"
  | "Tríceps"
  | "Quadríceps"
  | "Glúteos e posterior"
  | "Abdômen"
  | "Panturrilhas";

export type Difficulty = "Iniciante" | "Intermediário" | "Avançado";

export type AnalysisProfile = "squat" | "pushup" | "curl" | "lunge";

export type CameraView = "Lateral" | "Frontal" | "Frontal ou lateral";

export type EquipmentTag =
  | "nenhum"
  | "halteres"
  | "elastico"
  | "kettlebell"
  | "caneleira"
  | "banco"
  | "colchonete"
  | "barra"
  | "anilhas"
  | "rack"
  | "cabos"
  | "smith"
  | "leg_press"
  | "maquinas"
  | "barra_fixa";

export type LocationTag = "casa" | "academia" | "ar_livre" | "outro";

export interface EquipmentAlternative {
  missing: EquipmentTag;
  substituteExerciseId: string;
}

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
  /** Equipamentos necessários. `["nenhum"]` = peso corporal. */
  equipmentRequired: EquipmentTag[];
  locationCompatible: LocationTag[];
  equipmentAlternatives?: EquipmentAlternative[];
}

export type Surface =
  | "home"
  | "exercises"
  | "routine"
  | "analyze"
  | "about"
  | "history";

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

/** Resultado persistido no banco do navegador — sem vídeo e sem landmarks. */
export interface SavedAnalysis {
  id: string;
  createdAt: string;
  exerciseName: string;
  profile: AnalysisProfile;
  cameraView: "lateral" | "frontal";
  consistency: number;
  sampledFrames: number;
  validFrames: number;
  durationSeconds: number;
  demo?: boolean;
  cycles: CycleResult[];
  findings: Finding[];
}

export type PlannerGoal =
  | "Hipertrofia"
  | "Força"
  | "Condicionamento"
  | "Saúde e constância";

export type PlannerLevel = "Iniciante" | "Intermediário" | "Avançado";

export type PlannerSex = "Masculino" | "Feminino" | "Prefiro não informar";

export type WeekdayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export interface PlannerInput {
  heightCm: number;
  weightKg: number;
  sex: PlannerSex;
  goal: PlannerGoal;
  level: PlannerLevel;
  minutes: number;
  days: WeekdayKey[];
  muscles: MuscleGroup[];
  /** Ausente nos planos antigos: o motor não filtra por local. */
  location?: LocationTag;
  /** Ausente = catálogo completo (comportamento histórico). `[]` = nenhum equipamento. */
  equipment?: EquipmentTag[];
  equipmentUnknown?: boolean;
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

export interface PlanAdjustment {
  title: string;
  detail: string;
}

export type CheckInFeeling = "facil" | "adequado" | "dificil";

export type CheckInStatus = "pending" | "renewed" | "kept" | "dismissed";

export interface PlanCheckIn {
  status: CheckInStatus;
  feeling?: CheckInFeeling;
  answeredAt?: string;
}

export interface WeeklyPlan {
  createdAt: string;
  input: PlannerInput;
  rotation: number;
  adjustments: PlanAdjustment[];
  days: PlannedDay[];
  checkIn?: PlanCheckIn;
  calendarSyncedAt?: string;
}

export interface MoviaProfile {
  displayName: string | null;
  skippedName: boolean;
  googleEmail?: string | null;
}
