import type { PoseFrame } from "@/lib/types";
import {
  LANDMARK,
  angleAt,
  average,
  deviationFromLine,
  midpoint,
  tiltFromVertical,
  type Point,
} from "./geometry";
import type { JointTarget } from "./profiles";

function point(frame: PoseFrame, index: number): Point {
  return frame.landmarks[index] ?? { x: 0, y: 0, visibility: 0 };
}

export function kneeAngle(frame: PoseFrame): number {
  return average([
    angleAt(
      point(frame, LANDMARK.leftHip),
      point(frame, LANDMARK.leftKnee),
      point(frame, LANDMARK.leftAnkle),
    ),
    angleAt(
      point(frame, LANDMARK.rightHip),
      point(frame, LANDMARK.rightKnee),
      point(frame, LANDMARK.rightAnkle),
    ),
  ]);
}

export function elbowAngle(frame: PoseFrame): number {
  return average([
    angleAt(
      point(frame, LANDMARK.leftShoulder),
      point(frame, LANDMARK.leftElbow),
      point(frame, LANDMARK.leftWrist),
    ),
    angleAt(
      point(frame, LANDMARK.rightShoulder),
      point(frame, LANDMARK.rightElbow),
      point(frame, LANDMARK.rightWrist),
    ),
  ]);
}

export function jointAngle(frame: PoseFrame, joint: JointTarget): number {
  return joint === "knee" ? kneeAngle(frame) : elbowAngle(frame);
}

export function torsoTilt(frame: PoseFrame): number {
  const shoulder = midpoint(
    point(frame, LANDMARK.leftShoulder),
    point(frame, LANDMARK.rightShoulder),
  );
  const hip = midpoint(
    point(frame, LANDMARK.leftHip),
    point(frame, LANDMARK.rightHip),
  );
  return tiltFromVertical(shoulder, hip);
}

/** Desvio da linha ombro–quadril–tornozelo, usada na flexão de braço. */
export function bodyLineDeviation(frame: PoseFrame): number {
  const shoulder = midpoint(
    point(frame, LANDMARK.leftShoulder),
    point(frame, LANDMARK.rightShoulder),
  );
  const hip = midpoint(
    point(frame, LANDMARK.leftHip),
    point(frame, LANDMARK.rightHip),
  );
  const ankle = midpoint(
    point(frame, LANDMARK.leftAnkle),
    point(frame, LANDMARK.rightAnkle),
  );
  return deviationFromLine(shoulder, hip, ankle);
}

/** Quanto o cotovelo avança em relação à vertical do ombro, na rosca direta. */
export function elbowDrift(frame: PoseFrame): number {
  return average([
    tiltFromVertical(
      point(frame, LANDMARK.leftShoulder),
      point(frame, LANDMARK.leftElbow),
    ),
    tiltFromVertical(
      point(frame, LANDMARK.rightShoulder),
      point(frame, LANDMARK.rightElbow),
    ),
  ]);
}

/** Deslocamento horizontal joelho–tornozelo normalizado pela largura do quadril. */
export function kneeAnkleDrift(frame: PoseFrame): number {
  const leftHip = point(frame, LANDMARK.leftHip);
  const rightHip = point(frame, LANDMARK.rightHip);
  const hipWidth = Math.abs(leftHip.x - rightHip.x);
  if (hipWidth < 0.01) return 0;

  return average([
    Math.abs(
      point(frame, LANDMARK.leftKnee).x - point(frame, LANDMARK.leftAnkle).x,
    ) / hipWidth,
    Math.abs(
      point(frame, LANDMARK.rightKnee).x - point(frame, LANDMARK.rightAnkle).x,
    ) / hipWidth,
  ]);
}

export function frameQuality(frame: PoseFrame): number {
  return frame.quality;
}
