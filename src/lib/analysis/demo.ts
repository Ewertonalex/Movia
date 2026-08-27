import type { AnalysisResult, PoseFrame } from "@/lib/types";
import { buildAnalysis } from "./feedback";
import { LANDMARK } from "./geometry";
import { getProfile } from "./profiles";

interface DemoRep {
  minKnee: number;
  maxTilt: number;
  seconds: number;
}

const DEMO_REPS: DemoRep[] = [
  { minKnee: 104, maxTilt: 29, seconds: 1.3 },
  { minKnee: 118, maxTilt: 34, seconds: 1.3 },
  { minKnee: 107, maxTilt: 41, seconds: 1.4 },
  { minKnee: 120, maxTilt: 43, seconds: 1.3 },
  { minKnee: 105, maxTilt: 31, seconds: 1.4 },
];

const TOP_KNEE_ANGLE = 172;
const REST_SECONDS = 0.4;
const FPS = 10;

const SHANK = 0.15;
const THIGH = 0.16;
const TORSO = 0.21;
const UPPER_ARM = 0.11;
const FOREARM = 0.11;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function rotate(
  vector: { x: number; y: number },
  degrees: number,
): { x: number; y: number } {
  const radians = toRadians(degrees);
  return {
    x: vector.x * Math.cos(radians) - vector.y * Math.sin(radians),
    y: vector.x * Math.sin(radians) + vector.y * Math.cos(radians),
  };
}

function buildFrame(
  time: number,
  kneeAngle: number,
  tilt: number,
  shankTilt: number,
): PoseFrame {
  const ankle = { x: 0.46, y: 0.9 };
  const shankDirection = {
    x: Math.sin(toRadians(shankTilt)),
    y: -Math.cos(toRadians(shankTilt)),
  };
  const knee = {
    x: ankle.x + SHANK * shankDirection.x,
    y: ankle.y + SHANK * shankDirection.y,
  };

  const kneeToAnkle = { x: ankle.x - knee.x, y: ankle.y - knee.y };
  const thighDirection = rotate(kneeToAnkle, -kneeAngle);
  const thighLength = Math.hypot(thighDirection.x, thighDirection.y) || 1;
  const hip = {
    x: knee.x + (thighDirection.x / thighLength) * THIGH,
    y: knee.y + (thighDirection.y / thighLength) * THIGH,
  };

  const shoulder = {
    x: hip.x + TORSO * Math.sin(toRadians(tilt)),
    y: hip.y - TORSO * Math.cos(toRadians(tilt)),
  };
  const elbow = {
    x: shoulder.x + UPPER_ARM * 0.95,
    y: shoulder.y + UPPER_ARM * 0.3,
  };
  const wrist = { x: elbow.x + FOREARM, y: elbow.y - FOREARM * 0.1 };
  const nose = { x: shoulder.x + 0.03, y: shoulder.y - 0.06 };

  const landmarks = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.2,
  }));

  const place = (index: number, point: { x: number; y: number }, dx = 0) => {
    landmarks[index] = { x: point.x + dx, y: point.y, visibility: 0.93 };
  };

  place(LANDMARK.nose, nose);
  place(LANDMARK.leftShoulder, shoulder, -0.012);
  place(LANDMARK.rightShoulder, shoulder, 0.012);
  place(LANDMARK.leftElbow, elbow, -0.012);
  place(LANDMARK.rightElbow, elbow, 0.012);
  place(LANDMARK.leftWrist, wrist, -0.012);
  place(LANDMARK.rightWrist, wrist, 0.012);
  place(LANDMARK.leftHip, hip, -0.03);
  place(LANDMARK.rightHip, hip, 0.03);
  place(LANDMARK.leftKnee, knee, -0.03);
  place(LANDMARK.rightKnee, knee, 0.03);
  place(LANDMARK.leftAnkle, ankle, -0.03);
  place(LANDMARK.rightAnkle, ankle, 0.03);

  return { time: Number(time.toFixed(3)), quality: 0.91, landmarks };
}

/**
 * Sequência sintética de agachamento usada apenas na demonstração. O resultado
 * passa pelo mesmo motor de análise usado nos vídeos enviados.
 */
export function buildDemoFrames(): PoseFrame[] {
  const frames: PoseFrame[] = [];
  const step = 1 / FPS;
  let time = 0;

  const pushRest = (seconds: number) => {
    for (let t = 0; t < seconds; t += step) {
      frames.push(buildFrame(time, TOP_KNEE_ANGLE, 12, 4));
      time += step;
    }
  };

  pushRest(0.5);

  for (const rep of DEMO_REPS) {
    const total = Math.round(rep.seconds * FPS);
    for (let i = 0; i <= total; i += 1) {
      const phase = Math.sin((Math.PI * i) / total) ** 2;
      const knee = TOP_KNEE_ANGLE - (TOP_KNEE_ANGLE - rep.minKnee) * phase;
      const tilt = 12 + (rep.maxTilt - 12) * phase;
      const shankTilt = 4 + 16 * phase;
      frames.push(buildFrame(time, knee, tilt, shankTilt));
      time += step;
    }
    pushRest(REST_SECONDS);
  }

  pushRest(0.4);
  return frames;
}

export function buildDemoAnalysis(): AnalysisResult {
  const frames = buildDemoFrames();
  const analysis = buildAnalysis({
    profile: getProfile("squat"),
    cameraView: "lateral",
    frames,
    durationSeconds: frames[frames.length - 1]?.time ?? 0,
    sampledFrames: frames.length,
    validFrames: frames.length,
  });
  return { ...analysis, demo: true };
}
