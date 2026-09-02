import type {
  EquipmentAlternative,
  EquipmentTag,
  Exercise,
  LocationTag,
} from "@/lib/types";

export const ALL_LOCATIONS: LocationTag[] = [
  "casa",
  "academia",
  "ar_livre",
  "outro",
];

export const HOME_LOCATIONS: LocationTag[] = ["casa", "academia", "outro"];

export const GYM_ONLY: LocationTag[] = ["academia"];

interface GearMeta {
  equipmentRequired: EquipmentTag[];
  locationCompatible: LocationTag[];
  equipmentAlternatives?: EquipmentAlternative[];
}

const bodyweight = (locations: LocationTag[] = ALL_LOCATIONS): GearMeta => ({
  equipmentRequired: ["nenhum"],
  locationCompatible: locations,
});

/** Metadados dos 23 exercícios originais — o catálogo em si não é reescrito. */
export const CATALOG_GEAR: Record<string, GearMeta> = {
  "push-up": bodyweight(),
  "bench-press": {
    equipmentRequired: ["barra", "banco", "anilhas"],
    locationCompatible: GYM_ONLY,
    equipmentAlternatives: [
      { missing: "barra", substituteExerciseId: "incline-dumbbell-press" },
      { missing: "banco", substituteExerciseId: "floor-dumbbell-press" },
      { missing: "anilhas", substituteExerciseId: "push-up" },
    ],
  },
  "incline-dumbbell-press": {
    equipmentRequired: ["halteres", "banco"],
    locationCompatible: HOME_LOCATIONS,
    equipmentAlternatives: [
      { missing: "banco", substituteExerciseId: "floor-dumbbell-press" },
      { missing: "halteres", substituteExerciseId: "push-up" },
    ],
  },
  "pull-up": {
    equipmentRequired: ["barra_fixa"],
    locationCompatible: ["casa", "academia", "ar_livre"],
    equipmentAlternatives: [
      { missing: "barra_fixa", substituteExerciseId: "lat-pulldown" },
      { missing: "barra_fixa", substituteExerciseId: "inverted-row" },
      { missing: "barra_fixa", substituteExerciseId: "superman" },
    ],
  },
  "barbell-row": {
    equipmentRequired: ["barra", "anilhas"],
    locationCompatible: GYM_ONLY,
    equipmentAlternatives: [
      { missing: "barra", substituteExerciseId: "dumbbell-row" },
      { missing: "anilhas", substituteExerciseId: "inverted-row" },
    ],
  },
  "lat-pulldown": {
    equipmentRequired: ["cabos", "maquinas"],
    locationCompatible: GYM_ONLY,
    equipmentAlternatives: [
      { missing: "cabos", substituteExerciseId: "pull-up" },
      { missing: "maquinas", substituteExerciseId: "inverted-row" },
    ],
  },
  "shoulder-press": {
    equipmentRequired: ["halteres"],
    locationCompatible: HOME_LOCATIONS,
    equipmentAlternatives: [
      { missing: "halteres", substituteExerciseId: "pike-push-up" },
    ],
  },
  "lateral-raise": {
    equipmentRequired: ["halteres"],
    locationCompatible: HOME_LOCATIONS,
    equipmentAlternatives: [
      { missing: "halteres", substituteExerciseId: "pike-push-up" },
    ],
  },
  "face-pull": {
    equipmentRequired: ["cabos"],
    locationCompatible: GYM_ONLY,
    equipmentAlternatives: [
      { missing: "cabos", substituteExerciseId: "superman" },
    ],
  },
  "barbell-curl": {
    equipmentRequired: ["barra", "anilhas"],
    locationCompatible: ["casa", "academia"],
    equipmentAlternatives: [
      { missing: "barra", substituteExerciseId: "hammer-curl" },
      { missing: "anilhas", substituteExerciseId: "towel-curl" },
    ],
  },
  "hammer-curl": {
    equipmentRequired: ["halteres"],
    locationCompatible: HOME_LOCATIONS,
    equipmentAlternatives: [
      { missing: "halteres", substituteExerciseId: "towel-curl" },
    ],
  },
  "bench-dip": {
    equipmentRequired: ["banco"],
    locationCompatible: HOME_LOCATIONS,
    equipmentAlternatives: [
      { missing: "banco", substituteExerciseId: "diamond-push-up" },
    ],
  },
  "triceps-pushdown": {
    equipmentRequired: ["cabos"],
    locationCompatible: GYM_ONLY,
    equipmentAlternatives: [
      { missing: "cabos", substituteExerciseId: "diamond-push-up" },
    ],
  },
  "bodyweight-squat": bodyweight(),
  "reverse-lunge": bodyweight(),
  "leg-press": {
    equipmentRequired: ["leg_press", "maquinas"],
    locationCompatible: GYM_ONLY,
    equipmentAlternatives: [
      { missing: "leg_press", substituteExerciseId: "bodyweight-squat" },
      { missing: "maquinas", substituteExerciseId: "goblet-squat" },
    ],
  },
  "romanian-deadlift": {
    equipmentRequired: ["barra", "anilhas"],
    locationCompatible: GYM_ONLY,
    equipmentAlternatives: [
      { missing: "barra", substituteExerciseId: "glute-bridge" },
    ],
  },
  "hip-thrust": {
    equipmentRequired: ["banco", "barra"],
    locationCompatible: GYM_ONLY,
    equipmentAlternatives: [
      { missing: "banco", substituteExerciseId: "glute-bridge" },
      { missing: "barra", substituteExerciseId: "single-leg-glute-bridge" },
    ],
  },
  "glute-bridge": bodyweight(HOME_LOCATIONS),
  plank: bodyweight(),
  "dead-bug": bodyweight(HOME_LOCATIONS),
  crunch: bodyweight(),
  "standing-calf-raise": bodyweight(),
};

export const EXTRA_EXERCISES: Exercise[] = [
  {
    id: "floor-dumbbell-press",
    name: "Supino no chão",
    muscleGroup: "Peito",
    secondaryMuscles: ["Tríceps", "Ombros"],
    equipment: "Halteres",
    difficulty: "Iniciante",
    motion: "press",
    description:
      "Empurrada de peito no solo, útil quando não há banco e ainda há halteres.",
    steps: [
      "Deite no chão com os joelhos flexionados e os halteres ao lado do peito.",
      "Empurre até estender os cotovelos sem bater os halteres.",
      "Desça até os braços tocarem o chão com controle.",
    ],
    commonMistake: "Abrir demais os cotovelos ou perder o contato das escápulas.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Lateral",
    sortOrder: 24,
    videoId: "uUGDRwge4F8",
    videoSource: "Jeff Nippard",
    videoUrl: "https://www.youtube.com/watch?v=uUGDRwge4F8",
    equipmentRequired: ["halteres"],
    locationCompatible: HOME_LOCATIONS,
    equipmentAlternatives: [
      { missing: "halteres", substituteExerciseId: "push-up" },
    ],
  },
  {
    id: "superman",
    name: "Superman",
    muscleGroup: "Costas",
    secondaryMuscles: ["Glúteos", "Abdômen"],
    equipment: "Peso corporal",
    difficulty: "Iniciante",
    motion: "extension",
    description:
      "Extensão de tronco no solo para a cadeia posterior quando não há barra nem polia.",
    steps: [
      "Deite de barriga para baixo com braços à frente.",
      "Eleve braços e pernas juntos, sem jogar o pescoço para trás.",
      "Segure um instante e desça com controle.",
    ],
    commonMistake: "Hiperextender o pescoço ou usar impulso para subir.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Lateral",
    sortOrder: 25,
    videoId: "cc6UVRS7PW4",
    videoSource: "Get Healthy U",
    videoUrl: "https://www.youtube.com/watch?v=cc6UVRS7PW4",
    equipmentRequired: ["nenhum"],
    locationCompatible: ALL_LOCATIONS,
  },
  {
    id: "inverted-row",
    name: "Remada invertida",
    muscleGroup: "Costas",
    secondaryMuscles: ["Bíceps", "Abdômen"],
    equipment: "Peso corporal",
    difficulty: "Intermediário",
    motion: "row",
    description:
      "Puxada horizontal com o próprio corpo, usando mesa firme ou barra baixa.",
    steps: [
      "Segure uma barra baixa ou a borda de uma mesa estável.",
      "Mantenha o corpo em linha e puxe o peito em direção ao apoio.",
      "Desça até estender os braços sem perder a linha do tronco.",
    ],
    commonMistake: "Deixar o quadril cair ou encurtar a amplitude.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Lateral",
    sortOrder: 26,
    videoId: "KOee7YIXA1A",
    videoSource: "Calisthenic Movement",
    videoUrl: "https://www.youtube.com/watch?v=KOee7YIXA1A",
    equipmentRequired: ["nenhum"],
    locationCompatible: HOME_LOCATIONS,
  },
  {
    id: "dumbbell-row",
    name: "Remada com halter",
    muscleGroup: "Costas",
    secondaryMuscles: ["Bíceps", "Abdômen"],
    equipment: "Halteres",
    difficulty: "Iniciante",
    motion: "row",
    description:
      "Puxada unilateral com halter, alternativa à remada curvada com barra.",
    steps: [
      "Apoie uma mão e o joelho no banco ou numa superfície estável.",
      "Puxe o halter em direção ao quadril com a escápula organizada.",
      "Desça com controle sem girar o tronco.",
    ],
    commonMistake: "Usar o tronco para balançar a carga.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Lateral",
    sortOrder: 27,
    videoId: "6TSP1PNXb1s",
    videoSource: "ATHLEAN-X",
    videoUrl: "https://www.youtube.com/watch?v=6TSP1PNXb1s",
    equipmentRequired: ["halteres"],
    locationCompatible: HOME_LOCATIONS,
    equipmentAlternatives: [
      { missing: "halteres", substituteExerciseId: "inverted-row" },
    ],
  },
  {
    id: "pike-push-up",
    name: "Flexão pike",
    muscleGroup: "Ombros",
    secondaryMuscles: ["Tríceps", "Abdômen"],
    equipment: "Peso corporal",
    difficulty: "Intermediário",
    motion: "overhead",
    description:
      "Empurrada vertical com o peso do corpo, quando não há halteres para o desenvolvimento.",
    steps: [
      "Forme um V invertido com o quadril alto e as mãos no chão.",
      "Desça a cabeça em direção ao chão flexionando os cotovelos.",
      "Empurre de volta sem arquear a lombar.",
    ],
    commonMistake: "Deixar o peso nos pés em vez de nas mãos.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Lateral",
    sortOrder: 28,
    videoId: "RmKUhj62_9c",
    videoSource: "Calisthenic Movement",
    videoUrl: "https://www.youtube.com/watch?v=RmKUhj62_9c",
    equipmentRequired: ["nenhum"],
    locationCompatible: ALL_LOCATIONS,
  },
  {
    id: "towel-curl",
    name: "Rosca isométrica",
    muscleGroup: "Bíceps",
    secondaryMuscles: ["Antebraços"],
    equipment: "Peso corporal",
    difficulty: "Iniciante",
    motion: "curl",
    description:
      "Flexão de cotovelo contra a própria resistência, para treinar bíceps sem carga.",
    steps: [
      "Encaixe as palmas sob uma toalha, mesa ou contra a outra mão.",
      "Tente flexionar os cotovelos sem deixar o tronco balançar.",
      "Mantenha a tensão alguns segundos e relaxe com controle.",
    ],
    commonMistake: "Prender a respiração ou usar os ombros para compensar.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Lateral",
    sortOrder: 29,
    videoId: "eGO_RKcToSM",
    videoSource: "Nerd Fitness",
    videoUrl: "https://www.youtube.com/watch?v=eGO_RKcToSM",
    equipmentRequired: ["nenhum"],
    locationCompatible: ALL_LOCATIONS,
  },
  {
    id: "diamond-push-up",
    name: "Flexão diamante",
    muscleGroup: "Tríceps",
    secondaryMuscles: ["Peito", "Ombros"],
    equipment: "Peso corporal",
    difficulty: "Intermediário",
    motion: "pushup",
    description:
      "Flexão com as mãos próximas para deslocar o esforço ao tríceps, sem banco nem polia.",
    steps: [
      "Una polegares e indicadores sob o peito.",
      "Desça com o corpo em linha e os cotovelos junto ao tronco.",
      "Empurre o chão até estender os braços.",
    ],
    commonMistake: "Abrir os cotovelos ou deixar o quadril cair.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Lateral",
    sortOrder: 30,
    videoId: "J0DnG1_S92I",
    videoSource: "Calisthenic Movement",
    videoUrl: "https://www.youtube.com/watch?v=J0DnG1_S92I",
    equipmentRequired: ["nenhum"],
    locationCompatible: ALL_LOCATIONS,
  },
  {
    id: "goblet-squat",
    name: "Agachamento goblet",
    muscleGroup: "Quadríceps",
    secondaryMuscles: ["Glúteos", "Abdômen"],
    equipment: "Halteres",
    difficulty: "Iniciante",
    motion: "squat",
    description:
      "Agachamento com carga na frente do corpo, para casa com um único halter.",
    steps: [
      "Segure o halter junto ao peito.",
      "Desça com o tronco alto e os cotovelos entre os joelhos.",
      "Suba empurrando o chão sem perder o apoio dos pés.",
    ],
    commonMistake: "Deixar o tronco cair para frente ou os calcanhares levantarem.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Frontal ou lateral",
    sortOrder: 31,
    videoId: "MeIiIdhvXT4",
    videoSource: "Scott Herman Fitness",
    videoUrl: "https://www.youtube.com/watch?v=MeIiIdhvXT4",
    equipmentRequired: ["halteres"],
    locationCompatible: HOME_LOCATIONS,
    equipmentAlternatives: [
      { missing: "halteres", substituteExerciseId: "bodyweight-squat" },
    ],
  },
  {
    id: "single-leg-glute-bridge",
    name: "Ponte de glúteos unilateral",
    muscleGroup: "Glúteos e posterior",
    secondaryMuscles: ["Abdômen", "Posterior"],
    equipment: "Peso corporal",
    difficulty: "Intermediário",
    motion: "bridge",
    description:
      "Variação unilateral da ponte para progredir sem carga externa.",
    steps: [
      "Deite com um pé apoiado e a outra perna estendida.",
      "Eleve o quadril contraia o glúteo da perna de apoio.",
      "Desça sem deixar a pelve girar.",
    ],
    commonMistake: "Empurrar a lombar em vez de estender o quadril.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Lateral",
    sortOrder: 32,
    videoId: "zIYXRw5l5A4",
    videoSource: "Bret Contreras",
    videoUrl: "https://www.youtube.com/watch?v=zIYXRw5l5A4",
    equipmentRequired: ["nenhum"],
    locationCompatible: HOME_LOCATIONS,
  },
  {
    id: "dumbbell-tricep-extension",
    name: "Tríceps testa com halter",
    muscleGroup: "Tríceps",
    secondaryMuscles: ["Antebraços"],
    equipment: "Halteres",
    difficulty: "Iniciante",
    motion: "extension",
    description:
      "Extensão de cotovelo com halter, alternativa à polia quando só há pesos livres.",
    steps: [
      "Deite ou sente com o halter acima da cabeça.",
      "Flexione os cotovelos sem abrir os braços.",
      "Estenda até quase travar, mantendo os cotovelos estáveis.",
    ],
    commonMistake: "Deixar os cotovelos abrirem e perder a tensão no tríceps.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Lateral",
    sortOrder: 33,
    videoId: "ir5hB0V2LUI",
    videoSource: "Scott Herman Fitness",
    videoUrl: "https://www.youtube.com/watch?v=ir5hB0V2LUI",
    equipmentRequired: ["halteres"],
    locationCompatible: HOME_LOCATIONS,
    equipmentAlternatives: [
      { missing: "halteres", substituteExerciseId: "diamond-push-up" },
    ],
  },
  {
    id: "incline-push-up",
    name: "Flexão inclinada",
    muscleGroup: "Peito",
    secondaryMuscles: ["Tríceps", "Ombros"],
    equipment: "Peso corporal",
    difficulty: "Iniciante",
    motion: "pushup",
    description:
      "Flexão com as mãos elevadas, para reduzir a carga quando o movimento no chão ainda é difícil.",
    steps: [
      "Apoie as mãos numa superfície estável na altura do quadril ou um pouco abaixo.",
      "Desça o peito em direção ao apoio com o corpo em linha.",
      "Empurre até estender os braços sem perder a organização das escápulas.",
    ],
    commonMistake: "Deixar o quadril cair ou encurtar a amplitude no fundo.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Lateral",
    sortOrder: 34,
    videoId: "cfmmNlPnbdA",
    videoSource: "Calisthenic Movement",
    videoUrl: "https://www.youtube.com/watch?v=cfmmNlPnbdA",
    equipmentRequired: ["nenhum"],
    locationCompatible: ALL_LOCATIONS,
    equipmentAlternatives: [
      { missing: "nenhum", substituteExerciseId: "knee-push-up" },
    ],
  },
  {
    id: "knee-push-up",
    name: "Flexão com joelhos apoiados",
    muscleGroup: "Peito",
    secondaryMuscles: ["Tríceps", "Ombros"],
    equipment: "Peso corporal",
    difficulty: "Iniciante",
    motion: "pushup",
    description:
      "Variação da flexão com os joelhos no chão, para treinar o padrão de empurrar sem equipamento.",
    steps: [
      "Apoie joelhos e mãos no chão, com o tronco em linha até os joelhos.",
      "Desça o peito em direção ao chão flexionando os cotovelos.",
      "Empurre de volta sem perder a linha dos ombros até o quadril.",
    ],
    commonMistake: "Quebrar a linha do tronco ou abrir demais os cotovelos.",
    analyzable: false,
    analysisProfile: null,
    cameraView: "Lateral",
    sortOrder: 35,
    videoId: "WC4Kd_9f4AU",
    videoSource: "Calisthenic Movement",
    videoUrl: "https://www.youtube.com/watch?v=WC4Kd_9f4AU",
    equipmentRequired: ["nenhum"],
    locationCompatible: ALL_LOCATIONS,
    equipmentAlternatives: [
      { missing: "nenhum", substituteExerciseId: "incline-push-up" },
    ],
  },
];

type CatalogSeed = Omit<
  Exercise,
  "equipmentRequired" | "locationCompatible" | "equipmentAlternatives"
> &
  Partial<
    Pick<
      Exercise,
      "equipmentRequired" | "locationCompatible" | "equipmentAlternatives"
    >
  >;

export type { CatalogSeed };

export function applyCatalogGear(exercises: CatalogSeed[]): Exercise[] {
  return exercises.map((exercise) => {
    const gear = CATALOG_GEAR[exercise.id];
    return {
      ...exercise,
      equipmentRequired:
        exercise.equipmentRequired ?? gear?.equipmentRequired ?? ["nenhum"],
      locationCompatible:
        exercise.locationCompatible ??
        gear?.locationCompatible ??
        ALL_LOCATIONS,
      equipmentAlternatives:
        exercise.equipmentAlternatives ?? gear?.equipmentAlternatives,
    };
  });
}
