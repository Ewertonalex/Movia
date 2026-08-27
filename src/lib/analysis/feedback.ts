import type {
  AnalysisResult,
  ConfidenceLabel,
  CycleResult,
  Finding,
  PoseFrame,
  Severity,
} from "@/lib/types";
import { detectCycles, type AngleSample, type RawCycle } from "./cycles";
import { average, clamp, movingAverage, percentile, round } from "./geometry";
import {
  bodyLineDeviation,
  elbowDrift,
  jointAngle,
  kneeAnkleDrift,
  torsoTilt,
} from "./metrics";
import { FEEDBACK_THRESHOLDS, type CameraAngle, type ProfileConfig } from "./profiles";

export interface AnalysisInput {
  profile: ProfileConfig;
  cameraView: CameraAngle;
  frames: PoseFrame[];
  durationSeconds: number;
  sampledFrames: number;
  validFrames: number;
}

function confidenceLabel(value: number): ConfidenceLabel {
  if (value >= 0.78) return "Alta";
  if (value >= 0.58) return "Boa";
  return "Limitada";
}

function confidenceFor(
  quality: number,
  value: number,
  threshold: number,
): number {
  const excess = Math.abs(value - threshold) / Math.max(threshold, 1);
  const margin = clamp(excess / 0.3, 0, 1);
  return clamp(0.4 + quality * 0.38 + margin * 0.2, 0.34, 0.96);
}

function cycleWindow<T>(series: T[], cycle: RawCycle): T[] {
  return series.slice(cycle.startIndex, cycle.endIndex + 1);
}

function highValue(series: number[]): number {
  return percentile(series, 0.85);
}

interface RuleContext {
  cycle: RawCycle;
  cycleNumber: number;
  quality: number;
  cycleNoun: string;
  cameraView: CameraAngle;
  metrics: {
    minJointAngle: number;
    torsoTilt: number;
    bodyLine: number;
    elbowDrift: number;
    kneeAnkleDrift: number;
  };
}

function makeFinding(
  context: RuleContext,
  input: {
    key: string;
    title: string;
    detail: string;
    cue: string;
    severity: Severity;
    value: number;
    threshold: number;
  },
): Finding {
  const confidence = confidenceFor(
    context.quality,
    input.value,
    input.threshold,
  );
  return {
    id: `${input.key}-${context.cycleNumber}`,
    title: input.title,
    detail: input.detail,
    cue: input.cue,
    severity: input.severity,
    confidence: round(confidence, 2),
    confidenceLabel: confidenceLabel(confidence),
    cycleIndex: context.cycleNumber,
    timestamp: round(context.cycle.bottomTime, 2),
  };
}

function squatRules(context: RuleContext): Finding[] {
  const findings: Finding[] = [];
  const { metrics } = context;
  const rules = FEEDBACK_THRESHOLDS.squat;

  if (metrics.minJointAngle > rules.shallowKneeAngle) {
    findings.push(
      makeFinding(context, {
        key: "squat-depth",
        title: "Amplitude parcial",
        detail: `O joelho chegou a ${round(metrics.minJointAngle)}°, acima dos ${rules.shallowKneeAngle}° usados como referência de profundidade.`,
        cue: "Desça um pouco mais devagar, deixando o quadril ir para trás enquanto os pés seguem firmes no chão.",
        severity: "ajuste",
        value: metrics.minJointAngle,
        threshold: rules.shallowKneeAngle,
      }),
    );
  }

  if (
    context.cameraView === "lateral" &&
    metrics.torsoTilt > rules.torsoTiltLateral
  ) {
    findings.push(
      makeFinding(context, {
        key: "squat-torso",
        title: "Tronco muito inclinado",
        detail: `A inclinação do tronco chegou a ${round(metrics.torsoTilt)}°, acima dos ${rules.torsoTiltLateral}° observados como referência.`,
        cue: "Pense em manter o peito mais alto na subida e distribua o peso no meio do pé.",
        severity: "atencao",
        value: metrics.torsoTilt,
        threshold: rules.torsoTiltLateral,
      }),
    );
  }

  if (
    context.cameraView === "frontal" &&
    metrics.kneeAnkleDrift > rules.kneeAnkleDriftFrontal
  ) {
    findings.push(
      makeFinding(context, {
        key: "squat-knee-track",
        title: "Joelhos fora da linha dos pés",
        detail: `O desvio entre joelho e tornozelo ficou em ${round(metrics.kneeAnkleDrift, 2)}, acima do valor de referência ${rules.kneeAnkleDriftFrontal}.`,
        cue: "Aponte os joelhos na mesma direção dos pés e empurre o chão para fora ao subir.",
        severity: "atencao",
        value: metrics.kneeAnkleDrift,
        threshold: rules.kneeAnkleDriftFrontal,
      }),
    );
  }

  return findings;
}

function pushupRules(context: RuleContext): Finding[] {
  const findings: Finding[] = [];
  const { metrics } = context;
  const rules = FEEDBACK_THRESHOLDS.pushup;

  if (metrics.bodyLine > rules.bodyLineDeviation) {
    findings.push(
      makeFinding(context, {
        key: "pushup-line",
        title: "Linha do corpo perdida",
        detail: `O desvio da linha ombro–quadril–tornozelo chegou a ${round(metrics.bodyLine)}°, acima dos ${rules.bodyLineDeviation}° de referência.`,
        cue: "Ative glúteos e abdômen para manter uma linha contínua entre cabeça, quadril e tornozelos.",
        severity: "atencao",
        value: metrics.bodyLine,
        threshold: rules.bodyLineDeviation,
      }),
    );
  }

  if (metrics.minJointAngle > rules.shortRangeElbowAngle) {
    findings.push(
      makeFinding(context, {
        key: "pushup-depth",
        title: "Amplitude curta",
        detail: `O cotovelo chegou a ${round(metrics.minJointAngle)}°, acima dos ${rules.shortRangeElbowAngle}° usados como referência.`,
        cue: "Desça o peito um pouco mais, com os cotovelos em diagonal, dentro do que você controla.",
        severity: "ajuste",
        value: metrics.minJointAngle,
        threshold: rules.shortRangeElbowAngle,
      }),
    );
  }

  return findings;
}

function curlRules(context: RuleContext): Finding[] {
  const findings: Finding[] = [];
  const { metrics } = context;
  const rules = FEEDBACK_THRESHOLDS.curl;

  if (metrics.elbowDrift > rules.elbowDriftDegrees) {
    findings.push(
      makeFinding(context, {
        key: "curl-elbow",
        title: "Cotovelos avançando",
        detail: `Os cotovelos saíram ${round(metrics.elbowDrift)}° da vertical do ombro, acima dos ${rules.elbowDriftDegrees}° de referência.`,
        cue: "Mantenha os cotovelos junto às costelas e suba apenas com a flexão do braço.",
        severity: "atencao",
        value: metrics.elbowDrift,
        threshold: rules.elbowDriftDegrees,
      }),
    );
  }

  if (metrics.minJointAngle > rules.incompleteFlexionAngle) {
    findings.push(
      makeFinding(context, {
        key: "curl-range",
        title: "Flexão incompleta",
        detail: `O menor ângulo do cotovelo foi ${round(metrics.minJointAngle)}°, acima dos ${rules.incompleteFlexionAngle}° de referência.`,
        cue: "Suba até sentir o bíceps encurtar por completo, sem jogar o tronco para trás.",
        severity: "ajuste",
        value: metrics.minJointAngle,
        threshold: rules.incompleteFlexionAngle,
      }),
    );
  }

  return findings;
}

function lungeRules(context: RuleContext): Finding[] {
  const findings: Finding[] = [];
  const { metrics } = context;
  const rules = FEEDBACK_THRESHOLDS.lunge;

  if (metrics.minJointAngle > rules.shallowKneeAngle) {
    findings.push(
      makeFinding(context, {
        key: "lunge-depth",
        title: "Passada pouco profunda",
        detail: `O joelho chegou a ${round(metrics.minJointAngle)}°, acima dos ${rules.shallowKneeAngle}° usados como referência de passada.`,
        cue: "Dê um passo um pouco mais longo e desça os dois joelhos, sem forçar a amplitude.",
        severity: "ajuste",
        value: metrics.minJointAngle,
        threshold: rules.shallowKneeAngle,
      }),
    );
  }

  if (metrics.torsoTilt > rules.torsoTilt) {
    findings.push(
      makeFinding(context, {
        key: "lunge-torso",
        title: "Tronco muito inclinado",
        detail: `A inclinação do tronco chegou a ${round(metrics.torsoTilt)}°, acima dos ${rules.torsoTilt}° de referência.`,
        cue: "Olhe para frente e mantenha o tronco mais vertical enquanto empurra o chão.",
        severity: "atencao",
        value: metrics.torsoTilt,
        threshold: rules.torsoTilt,
      }),
    );
  }

  return findings;
}

function tempoRule(
  context: RuleContext,
  limitSeconds: number,
): Finding | null {
  if (context.cycle.duration >= limitSeconds) return null;
  return makeFinding(context, {
    key: "tempo",
    title: "Ritmo acelerado",
    detail: `Esta ${context.cycleNoun} durou ${round(context.cycle.duration, 2)} s, abaixo dos ${limitSeconds} s usados como referência de controle.`,
    cue: "Conte dois tempos na descida e um na subida para manter o controle do movimento.",
    severity: "ajuste",
    value: limitSeconds,
    threshold: Math.max(context.cycle.duration, 0.1),
  });
}

export function buildAngleSamples(
  frames: PoseFrame[],
  profile: ProfileConfig,
): AngleSample[] {
  const raw = frames.map((frame) => jointAngle(frame, profile.joint));
  const smoothed = movingAverage(raw, 2);
  return frames.map((frame, index) => ({
    time: frame.time,
    angle: smoothed[index],
  }));
}

export function buildAnalysis(input: AnalysisInput): AnalysisResult {
  const { frames, profile, cameraView } = input;
  const samples = buildAngleSamples(frames, profile);
  const rawCycles = detectCycles(samples, profile.id);

  const torsoSeries = frames.map(torsoTilt);
  const bodyLineSeries = frames.map(bodyLineDeviation);
  const elbowDriftSeries = frames.map(elbowDrift);
  const kneeDriftSeries = frames.map(kneeAnkleDrift);
  const qualitySeries = frames.map((frame) => frame.quality);

  const findings: Finding[] = [];
  const cycles: CycleResult[] = rawCycles.map((cycle, index) => {
    const cycleNumber = index + 1;
    const context: RuleContext = {
      cycle,
      cycleNumber,
      quality: average(cycleWindow(qualitySeries, cycle)),
      cycleNoun: profile.cycleNoun.one,
      cameraView,
      metrics: {
        minJointAngle: cycle.minAngle,
        torsoTilt: highValue(cycleWindow(torsoSeries, cycle)),
        bodyLine: highValue(cycleWindow(bodyLineSeries, cycle)),
        elbowDrift: highValue(cycleWindow(elbowDriftSeries, cycle)),
        kneeAnkleDrift: highValue(cycleWindow(kneeDriftSeries, cycle)),
      },
    };

    const cycleFindings: Finding[] = [];
    if (profile.id === "squat") cycleFindings.push(...squatRules(context));
    if (profile.id === "pushup") cycleFindings.push(...pushupRules(context));
    if (profile.id === "curl") cycleFindings.push(...curlRules(context));
    if (profile.id === "lunge") cycleFindings.push(...lungeRules(context));

    const tempo = tempoRule(context, profile.fastTempoSeconds);
    if (tempo) cycleFindings.push(tempo);

    findings.push(...cycleFindings);

    return {
      index: cycleNumber,
      startTime: round(cycle.startTime, 2),
      bottomTime: round(cycle.bottomTime, 2),
      endTime: round(cycle.endTime, 2),
      duration: round(cycle.duration, 2),
      minAngle: round(cycle.minAngle),
      maxAngle: round(cycle.maxAngle),
      score: clamp(Math.round(96 - 11 * cycleFindings.length), 58, 98),
      findingIds: cycleFindings.map((finding) => finding.id),
    };
  });

  if (cycles.length > 0 && findings.length === 0) {
    const quality = average(qualitySeries);
    const confidence = clamp(0.5 + quality * 0.42, 0.34, 0.96);
    findings.push({
      id: "consistent",
      title: "Movimento consistente",
      detail: `Nas ${cycles.length === 1 ? profile.cycleNoun.one : profile.cycleNoun.many} analisadas não encontramos desvios acima das referências visuais deste exercício.`,
      cue: "Mantenha esse padrão e aumente a exigência aos poucos, respeitando sua mobilidade.",
      severity: "ok",
      confidence: round(confidence, 2),
      confidenceLabel: confidenceLabel(confidence),
      cycleIndex: 1,
      timestamp: cycles[0].bottomTime,
    });
  }

  const consistency =
    cycles.length === 0
      ? 0
      : Math.round(average(cycles.map((cycle) => cycle.score)));

  return {
    profile: profile.id,
    cameraView,
    cycles,
    findings,
    consistency,
    frames,
    sampledFrames: input.sampledFrames,
    validFrames: input.validFrames,
    durationSeconds: input.durationSeconds,
  };
}
