import type { AnalysisProfile } from "@/lib/types";

export type JointTarget = "knee" | "elbow";
export type CameraAngle = "lateral" | "frontal";

export interface CycleThresholds {
  high: number;
  down: number;
  minCycleSeconds: number;
}

export interface ProfileConfig {
  id: AnalysisProfile;
  code: string;
  name: string;
  summary: string;
  joint: JointTarget;
  cameraAngles: CameraAngle[];
  defaultCamera: CameraAngle;
  continuous: boolean;
  cycleNoun: { one: string; many: string; verbOne: string; verbMany: string };
  referenceExerciseId: string;
  recordingTips: string[];
  fastTempoSeconds: number;
  emptyCycleMessage: string;
}

export const CYCLE_THRESHOLDS: Record<
  Exclude<AnalysisProfile, "lunge">,
  CycleThresholds
> = {
  squat: { high: 158, down: 132, minCycleSeconds: 0.65 },
  pushup: { high: 148, down: 112, minCycleSeconds: 0.65 },
  curl: { high: 135, down: 92, minCycleSeconds: 0.65 },
};

export const LUNGE_DETECTION = {
  lowPercentile: 0.15,
  highPercentile: 0.85,
  minRangeDegrees: 12,
  bottomRangeRatio: 0.46,
  minSeparationSeconds: 0.55,
  minProminenceDegrees: 8,
  prominenceRangeRatio: 0.24,
  minStrideSeconds: 0.45,
  maxStrideSeconds: 4,
} as const;

export const MAX_CYCLES = 20;

export const FEEDBACK_THRESHOLDS = {
  squat: {
    shallowKneeAngle: 112,
    torsoTiltLateral: 38,
    kneeAnkleDriftFrontal: 0.2,
  },
  pushup: {
    bodyLineDeviation: 13,
    shortRangeElbowAngle: 105,
  },
  curl: {
    elbowDriftDegrees: 27,
    incompleteFlexionAngle: 90,
  },
  lunge: {
    shallowKneeAngle: 122,
    torsoTilt: 42,
  },
  tempo: {
    stationarySeconds: 1.05,
    lungeSeconds: 0.65,
  },
} as const;

export const POSE_SAMPLING = {
  fps: 10,
  minFrameQuality: 0.32,
  minValidFramesAbsolute: 12,
  minValidFramesRatio: 0.35,
  detectionConfidence: 0.48,
  presenceConfidence: 0.48,
  trackingConfidence: 0.48,
} as const;

export const UPLOAD_LIMITS = {
  maxBytes: 250 * 1024 * 1024,
  maxSeconds: 45,
  acceptedTypes: ["video/mp4", "video/quicktime", "video/webm"],
  acceptAttribute: "video/mp4,video/quicktime,video/webm,video/*",
} as const;

export const ANALYSIS_PROFILES: ProfileConfig[] = [
  {
    id: "squat",
    code: "SQ",
    name: "Agachamento",
    summary: "Padrão de agachar com quadris, joelhos e tornozelos.",
    joint: "knee",
    cameraAngles: ["lateral", "frontal"],
    defaultCamera: "lateral",
    continuous: false,
    cycleNoun: {
      one: "repetição",
      many: "repetições",
      verbOne: "encontrada",
      verbMany: "encontradas",
    },
    referenceExerciseId: "bodyweight-squat",
    recordingTips: [
      "Corpo inteiro visível, dos pés à cabeça.",
      "Câmera estável no ângulo escolhido, na altura do quadril.",
      "Faça de 3 a 8 repetições em uma posição neutra.",
    ],
    fastTempoSeconds: 1.05,
    emptyCycleMessage:
      "Não identificamos um ciclo completo de descida e subida. Grave de 3 a 8 repetições com as pernas inteiras no quadro.",
  },
  {
    id: "pushup",
    code: "FX",
    name: "Flexão",
    summary: "Empurrada horizontal com o corpo alinhado.",
    joint: "elbow",
    cameraAngles: ["lateral"],
    defaultCamera: "lateral",
    continuous: false,
    cycleNoun: {
      one: "repetição",
      many: "repetições",
      verbOne: "encontrada",
      verbMany: "encontradas",
    },
    referenceExerciseId: "push-up",
    recordingTips: [
      "Corpo inteiro visível, das mãos aos pés.",
      "Câmera estável de lado, na altura do tronco.",
      "Faça de 3 a 8 repetições em uma posição neutra.",
    ],
    fastTempoSeconds: 1.05,
    emptyCycleMessage:
      "Não identificamos um ciclo completo de descida e subida. Grave de 3 a 8 repetições com o corpo inteiro no quadro.",
  },
  {
    id: "curl",
    code: "RC",
    name: "Rosca direta",
    summary: "Flexão de cotovelos com trajetória simples.",
    joint: "elbow",
    cameraAngles: ["lateral"],
    defaultCamera: "lateral",
    continuous: false,
    cycleNoun: {
      one: "repetição",
      many: "repetições",
      verbOne: "encontrada",
      verbMany: "encontradas",
    },
    referenceExerciseId: "barbell-curl",
    recordingTips: [
      "Corpo inteiro visível, com braços livres no quadro.",
      "Câmera estável de lado, na altura do tronco.",
      "Faça de 3 a 8 repetições em uma posição neutra.",
    ],
    fastTempoSeconds: 1.05,
    emptyCycleMessage:
      "Não identificamos um ciclo completo de flexão e extensão. Grave de 3 a 8 repetições com os braços inteiros no quadro.",
  },
  {
    id: "lunge",
    code: "AF",
    name: "Afundo livre / caminhando",
    summary: "Passadas contínuas, alternando as pernas.",
    joint: "knee",
    cameraAngles: ["lateral"],
    defaultCamera: "lateral",
    continuous: true,
    cycleNoun: {
      one: "passada",
      many: "passadas",
      verbOne: "encontrada",
      verbMany: "encontradas",
    },
    referenceExerciseId: "reverse-lunge",
    recordingTips: [
      "Corpo inteiro visível durante todo o deslocamento.",
      "Câmera estável de lado, acompanhando o trajeto.",
      "Faça de 2 a 6 passadas. Você não precisa voltar ao mesmo lugar.",
    ],
    fastTempoSeconds: 0.65,
    emptyCycleMessage:
      "Não identificamos nenhuma passada. Grave pelo menos uma descida e subida de lado, com as pernas inteiras no quadro. Você não precisa voltar à posição neutra.",
  },
];

export function getProfile(id: AnalysisProfile): ProfileConfig {
  const profile = ANALYSIS_PROFILES.find((item) => item.id === id);
  if (!profile) throw new Error(`Perfil de análise desconhecido: ${id}`);
  return profile;
}

export function cycleCountLabel(
  profile: ProfileConfig,
  count: number,
): string {
  const noun = count === 1 ? profile.cycleNoun.one : profile.cycleNoun.many;
  const verb = count === 1 ? profile.cycleNoun.verbOne : profile.cycleNoun.verbMany;
  return `${count} ${noun} ${verb}`;
}
