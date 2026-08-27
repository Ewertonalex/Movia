export interface Point {
  x: number;
  y: number;
  visibility?: number;
}

export const LANDMARK = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;

export const RELEVANT_LANDMARKS: number[] = [
  LANDMARK.leftShoulder,
  LANDMARK.rightShoulder,
  LANDMARK.leftElbow,
  LANDMARK.rightElbow,
  LANDMARK.leftWrist,
  LANDMARK.rightWrist,
  LANDMARK.leftHip,
  LANDMARK.rightHip,
  LANDMARK.leftKnee,
  LANDMARK.rightKnee,
  LANDMARK.leftAnkle,
  LANDMARK.rightAnkle,
];

export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Ângulo interno em `b`, formado por a-b-c, em graus. */
export function angleAt(a: Point, b: Point, c: Point): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magnitude = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (magnitude === 0) return 180;
  return (Math.acos(clamp(dot / magnitude, -1, 1)) * 180) / Math.PI;
}

/** Inclinação de um segmento em relação à vertical da imagem, em graus. */
export function tiltFromVertical(top: Point, bottom: Point): number {
  const dx = bottom.x - top.x;
  const dy = bottom.y - top.y;
  if (dx === 0 && dy === 0) return 0;
  return (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI;
}

/** Desvio da linha reta a-b-c: 0° significa perfeitamente alinhado. */
export function deviationFromLine(a: Point, b: Point, c: Point): number {
  return Math.abs(180 - angleAt(a, b, c));
}

export function movingAverage(series: number[], radius = 2): number[] {
  if (series.length === 0) return [];
  return series.map((_, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(series.length - 1, index + radius);
    let sum = 0;
    for (let i = start; i <= end; i += 1) sum += series[i];
    return sum / (end - start + 1);
  });
}

export function percentile(series: number[], ratio: number): number {
  if (series.length === 0) return 0;
  const sorted = [...series].sort((a, b) => a - b);
  const position = clamp(ratio, 0, 1) * (sorted.length - 1);
  const low = Math.floor(position);
  const high = Math.ceil(position);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

export function average(series: number[]): number {
  if (series.length === 0) return 0;
  return series.reduce((total, value) => total + value, 0) / series.length;
}

export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
