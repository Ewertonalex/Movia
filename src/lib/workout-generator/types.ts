import type {
  EquipmentTag,
  LocationTag,
  MuscleGroup,
  PlannerInput,
  PlannerLevel,
  PlannerSex,
} from "@/lib/types";

export const EQUIPMENT_TAGS: { id: EquipmentTag; label: string; group: "none" | "basic" | "gym" }[] =
  [
    { id: "nenhum", label: "Nenhum", group: "none" },
    { id: "halteres", label: "Halteres", group: "basic" },
    { id: "elastico", label: "Elástico", group: "basic" },
    { id: "kettlebell", label: "Kettlebell", group: "basic" },
    { id: "caneleira", label: "Caneleira", group: "basic" },
    { id: "banco", label: "Banco", group: "basic" },
    { id: "colchonete", label: "Colchonete", group: "basic" },
    { id: "barra", label: "Barra", group: "gym" },
    { id: "anilhas", label: "Anilhas", group: "gym" },
    { id: "rack", label: "Rack", group: "gym" },
    { id: "cabos", label: "Cabos", group: "gym" },
    { id: "smith", label: "Smith", group: "gym" },
    { id: "leg_press", label: "Leg press", group: "gym" },
    { id: "maquinas", label: "Máquinas de musculação", group: "gym" },
    { id: "barra_fixa", label: "Barra fixa", group: "gym" },
  ];

export const LOCATIONS: { id: LocationTag; label: string }[] = [
  { id: "casa", label: "Casa" },
  { id: "academia", label: "Academia" },
  { id: "ar_livre", label: "Ao ar livre" },
  { id: "outro", label: "Outro" },
];

export type QuickStartGoal =
  | "Hipertrofia"
  | "Emagrecimento"
  | "Ganho de força"
  | "Resistência"
  | "Condicionamento físico"
  | "Mobilidade"
  | "Saúde e bem-estar"
  | "Manutenção";

export const QUICK_START_GOALS: QuickStartGoal[] = [
  "Hipertrofia",
  "Emagrecimento",
  "Ganho de força",
  "Resistência",
  "Condicionamento físico",
  "Mobilidade",
  "Saúde e bem-estar",
  "Manutenção",
];

export const QUICK_START_MINUTES = [15, 20, 30, 45, 60, 75] as const;

export interface QuickStartInput {
  sex: PlannerSex;
  goal: QuickStartGoal;
  level: PlannerLevel;
  location: LocationTag;
  equipment: EquipmentTag[];
  unknownEquipment: boolean;
  muscles: MuscleGroup[];
  fullBody: boolean;
  minutes: number;
  daysPerWeek: number;
}

export interface GeneratorInput extends PlannerInput {
  location: LocationTag;
  equipment: EquipmentTag[];
}
