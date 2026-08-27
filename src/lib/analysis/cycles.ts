import type { AnalysisProfile } from "@/lib/types";
import { percentile } from "./geometry";
import { CYCLE_THRESHOLDS, LUNGE_DETECTION, MAX_CYCLES } from "./profiles";

export interface AngleSample {
  time: number;
  angle: number;
}

export interface RawCycle {
  startIndex: number;
  bottomIndex: number;
  endIndex: number;
  startTime: number;
  bottomTime: number;
  endTime: number;
  duration: number;
  minAngle: number;
  maxAngle: number;
}

function buildCycle(
  samples: AngleSample[],
  startIndex: number,
  bottomIndex: number,
  endIndex: number,
): RawCycle {
  let minAngle = Number.POSITIVE_INFINITY;
  let maxAngle = Number.NEGATIVE_INFINITY;
  for (let i = startIndex; i <= endIndex; i += 1) {
    const { angle } = samples[i];
    if (angle < minAngle) minAngle = angle;
    if (angle > maxAngle) maxAngle = angle;
  }
  const startTime = samples[startIndex].time;
  const endTime = samples[endIndex].time;
  return {
    startIndex,
    bottomIndex,
    endIndex,
    startTime,
    bottomTime: samples[bottomIndex].time,
    endTime,
    duration: endTime - startTime,
    minAngle,
    maxAngle,
  };
}

/**
 * Exercícios estacionários voltam a uma posição alta a cada repetição, então a
 * detecção usa uma máquina de estados com histerese entre `high` e `down`.
 */
export function detectStationaryCycles(
  samples: AngleSample[],
  profile: Exclude<AnalysisProfile, "lunge">,
): RawCycle[] {
  const { high, down, minCycleSeconds } = CYCLE_THRESHOLDS[profile];
  const cycles: RawCycle[] = [];

  let armed = false;
  let lastHighIndex = 0;
  let descending = false;
  let startIndex = 0;
  let bottomIndex = 0;

  for (let i = 0; i < samples.length; i += 1) {
    const { angle } = samples[i];

    if (!descending) {
      if (angle > high) {
        armed = true;
        lastHighIndex = i;
      } else if (armed && angle < down) {
        descending = true;
        startIndex = lastHighIndex;
        bottomIndex = i;
      }
      continue;
    }

    if (angle < samples[bottomIndex].angle) {
      bottomIndex = i;
    }

    if (angle > high) {
      const cycle = buildCycle(samples, startIndex, bottomIndex, i);
      if (cycle.duration >= minCycleSeconds) cycles.push(cycle);
      descending = false;
      armed = true;
      lastHighIndex = i;
    }
  }

  return cycles.slice(0, MAX_CYCLES);
}

function findValleys(
  samples: AngleSample[],
  bottomThreshold: number,
): number[] {
  const valleys: number[] = [];
  let regionStart = -1;

  for (let i = 0; i < samples.length; i += 1) {
    const below = samples[i].angle <= bottomThreshold;
    if (below && regionStart === -1) regionStart = i;
    if ((!below || i === samples.length - 1) && regionStart !== -1) {
      const regionEnd = below ? i : i - 1;
      let bestIndex = regionStart;
      for (let j = regionStart; j <= regionEnd; j += 1) {
        if (samples[j].angle < samples[bestIndex].angle) bestIndex = j;
      }
      valleys.push(bestIndex);
      regionStart = -1;
    }
  }

  return valleys;
}

function peakBetween(
  samples: AngleSample[],
  from: number,
  to: number,
): number {
  let bestIndex = from;
  for (let i = from; i <= to; i += 1) {
    if (samples[i].angle > samples[bestIndex].angle) bestIndex = i;
  }
  return bestIndex;
}

/**
 * O afundo caminhando é contínuo: a pessoa não retorna à mesma posição neutra,
 * então cada passada é um vale proeminente na flexão do joelho.
 */
export function detectContinuousStrides(samples: AngleSample[]): RawCycle[] {
  if (samples.length < 4) return [];

  const angles = samples.map((sample) => sample.angle);
  const low = percentile(angles, LUNGE_DETECTION.lowPercentile);
  const high = percentile(angles, LUNGE_DETECTION.highPercentile);
  const range = high - low;

  if (range < LUNGE_DETECTION.minRangeDegrees) return [];

  const bottomThreshold = low + range * LUNGE_DETECTION.bottomRangeRatio;
  const minProminence = Math.max(
    LUNGE_DETECTION.minProminenceDegrees,
    range * LUNGE_DETECTION.prominenceRangeRatio,
  );

  const candidates = findValleys(samples, bottomThreshold);
  if (candidates.length === 0) return [];

  const separated: number[] = [];
  for (const index of candidates) {
    const previous = separated[separated.length - 1];
    if (
      previous !== undefined &&
      samples[index].time - samples[previous].time <
        LUNGE_DETECTION.minSeparationSeconds
    ) {
      if (samples[index].angle < samples[previous].angle) {
        separated[separated.length - 1] = index;
      }
      continue;
    }
    separated.push(index);
  }

  const strides: RawCycle[] = [];

  for (let i = 0; i < separated.length; i += 1) {
    const valley = separated[i];
    const leftBound = i === 0 ? 0 : separated[i - 1];
    const rightBound =
      i === separated.length - 1 ? samples.length - 1 : separated[i + 1];

    const leftPeak = peakBetween(samples, leftBound, valley);
    const rightPeak = peakBetween(samples, valley, rightBound);
    const prominence = Math.min(
      samples[leftPeak].angle - samples[valley].angle,
      samples[rightPeak].angle - samples[valley].angle,
    );

    if (prominence < minProminence) continue;

    const cycle = buildCycle(samples, leftPeak, valley, rightPeak);
    if (
      cycle.duration < LUNGE_DETECTION.minStrideSeconds ||
      cycle.duration > LUNGE_DETECTION.maxStrideSeconds
    ) {
      continue;
    }

    strides.push(cycle);
  }

  return strides.slice(0, MAX_CYCLES);
}

export function detectCycles(
  samples: AngleSample[],
  profile: AnalysisProfile,
): RawCycle[] {
  if (profile === "lunge") return detectContinuousStrides(samples);
  return detectStationaryCycles(samples, profile);
}
