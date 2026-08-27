import type { PoseFrame } from "@/lib/types";
import { RELEVANT_LANDMARKS, average } from "./geometry";
import { POSE_SAMPLING } from "./profiles";

export type AnalysisErrorCode =
  | "unsupported-browser"
  | "low-visibility"
  | "no-cycles"
  | "processing";

export class AnalysisError extends Error {
  code: AnalysisErrorCode;

  constructor(code: AnalysisErrorCode, message: string) {
    super(message);
    this.name = "AnalysisError";
    this.code = code;
  }
}

export type ProgressStage =
  | "model"
  | "landmarks"
  | "cycles"
  | "recommendations";

export const PROGRESS_MESSAGES: Record<ProgressStage, string> = {
  model: "Carregando o modelo de pose no seu dispositivo",
  landmarks: "Mapeando as articulações frame a frame",
  cycles: "Identificando repetições e passadas",
  recommendations: "Organizando as recomendações",
};

export interface PoseExtraction {
  frames: PoseFrame[];
  sampledFrames: number;
  validFrames: number;
  durationSeconds: number;
}

const WASM_PATH = "/mediapipe/wasm";
const LOCAL_MODEL_PATH = "/mediapipe/models/pose_landmarker_lite.task";
const REMOTE_MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("seeked", done);
      resolve();
    };
    video.addEventListener("seeked", done, { once: true });
    video.currentTime = time;
    window.setTimeout(done, 900);
  });
}

async function resolveModelPath(): Promise<string> {
  try {
    const response = await fetch(LOCAL_MODEL_PATH, { method: "HEAD" });
    if (response.ok) return LOCAL_MODEL_PATH;
  } catch {
    // segue para o modelo público
  }
  return REMOTE_MODEL_PATH;
}

export async function extractPoseFrames(
  video: HTMLVideoElement,
  onProgress: (stage: ProgressStage, ratio: number) => void,
): Promise<PoseExtraction> {
  if (typeof WebAssembly === "undefined") {
    throw new AnalysisError(
      "unsupported-browser",
      "Este navegador não tem suporte às tecnologias necessárias para a análise. Tente a versão mais recente do Chrome, Edge, Firefox ou Safari.",
    );
  }

  onProgress("model", 0.04);

  let vision;
  try {
    vision = await import("@mediapipe/tasks-vision");
  } catch {
    throw new AnalysisError(
      "unsupported-browser",
      "Não foi possível carregar o motor de análise neste navegador. Tente a versão mais recente do Chrome, Edge, Firefox ou Safari.",
    );
  }

  const { FilesetResolver, PoseLandmarker } = vision;
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
  const modelAssetPath = await resolveModelPath();

  const baseConfig = {
    runningMode: "VIDEO" as const,
    numPoses: 1,
    minPoseDetectionConfidence: POSE_SAMPLING.detectionConfidence,
    minPosePresenceConfidence: POSE_SAMPLING.presenceConfidence,
    minTrackingConfidence: POSE_SAMPLING.trackingConfidence,
  };

  let landmarker: Awaited<ReturnType<typeof PoseLandmarker.createFromOptions>>;
  try {
    landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath, delegate: "GPU" },
      ...baseConfig,
    });
  } catch {
    landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath, delegate: "CPU" },
      ...baseConfig,
    });
  }

  onProgress("landmarks", 0.16);

  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const step = 1 / POSE_SAMPLING.fps;
  const frames: PoseFrame[] = [];
  let sampledFrames = 0;
  let lastTimestamp = -1;

  try {
    video.pause();
    for (let time = 0; time < duration; time += step) {
      await seekTo(video, Math.min(time, Math.max(duration - 0.02, 0)));
      sampledFrames += 1;

      const timestamp = Math.max(
        Math.round(video.currentTime * 1000),
        lastTimestamp + 1,
      );
      lastTimestamp = timestamp;

      let result;
      try {
        result = landmarker.detectForVideo(video, timestamp);
      } catch {
        continue;
      }

      const landmarks = result.landmarks?.[0];
      if (!landmarks || landmarks.length === 0) continue;

      const quality = average(
        RELEVANT_LANDMARKS.map((index) => landmarks[index]?.visibility ?? 0),
      );
      if (quality < POSE_SAMPLING.minFrameQuality) continue;

      frames.push({
        time: Number((timestamp / 1000).toFixed(3)),
        quality,
        landmarks: landmarks.map((landmark) => ({
          x: landmark.x,
          y: landmark.y,
          visibility: landmark.visibility ?? 0,
        })),
      });

      if (sampledFrames % 5 === 0 && duration > 0) {
        onProgress("landmarks", 0.16 + (time / duration) * 0.62);
      }
    }
  } finally {
    landmarker.close();
    video.currentTime = 0;
  }

  onProgress("cycles", 0.84);

  const minValidFrames = Math.max(
    POSE_SAMPLING.minValidFramesAbsolute,
    Math.ceil(sampledFrames * POSE_SAMPLING.minValidFramesRatio),
  );

  if (frames.length < minValidFrames) {
    throw new AnalysisError(
      "low-visibility",
      "As articulações apareceram pouco visíveis no vídeo. Grave com o corpo inteiro no quadro, boa iluminação e a câmera parada.",
    );
  }

  return {
    frames,
    sampledFrames,
    validFrames: frames.length,
    durationSeconds: duration,
  };
}
