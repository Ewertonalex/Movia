import { describe, expect, it } from "vitest";
import { buildDemoAnalysis, buildDemoFrames } from "@/lib/analysis/demo";
import { buildAnalysis } from "@/lib/analysis/feedback";
import { angleAt, movingAverage, percentile } from "@/lib/analysis/geometry";
import { kneeAngle, torsoTilt } from "@/lib/analysis/metrics";
import { cycleCountLabel, getProfile } from "@/lib/analysis/profiles";
import {
  validateDuration,
  validateVideoFile,
} from "@/lib/analysis/upload";

describe("geometria", () => {
  it("calcula ângulos internos conhecidos", () => {
    expect(
      angleAt({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }),
    ).toBeCloseTo(90, 5);
    expect(
      angleAt({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }),
    ).toBeCloseTo(180, 5);
  });

  it("suaviza séries com média móvel de raio 2", () => {
    expect(movingAverage([10, 20, 30, 40, 50], 2)).toEqual([
      20, 25, 30, 35, 40,
    ]);
  });

  it("calcula percentis usados na detecção de passadas", () => {
    const series = [90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190];
    expect(percentile(series, 0.15)).toBeCloseTo(105, 5);
    expect(percentile(series, 0.85)).toBeCloseTo(175, 5);
  });
});

describe("métricas de pose", () => {
  const frames = buildDemoFrames();

  it("gera a amplitude de joelho esperada na sequência sintética", () => {
    const angles = frames.map(kneeAngle);
    expect(Math.max(...angles)).toBeGreaterThan(165);
    expect(Math.min(...angles)).toBeLessThan(115);
  });

  it("acompanha a inclinação do tronco durante a descida", () => {
    const tilts = frames.map(torsoTilt);
    expect(Math.max(...tilts)).toBeGreaterThan(38);
    expect(Math.min(...tilts)).toBeLessThan(15);
  });
});

describe("análise de demonstração", () => {
  const analysis = buildDemoAnalysis();

  it("encontra as cinco repetições sintéticas", () => {
    expect(analysis.demo).toBe(true);
    expect(analysis.cycles).toHaveLength(5);
    expect(analysis.profile).toBe("squat");
  });

  it("pontua cada repetição dentro da faixa permitida", () => {
    for (const cycle of analysis.cycles) {
      expect(cycle.score).toBeGreaterThanOrEqual(58);
      expect(cycle.score).toBeLessThanOrEqual(98);
    }
    expect(analysis.consistency).toBeGreaterThanOrEqual(58);
    expect(analysis.consistency).toBeLessThanOrEqual(98);
  });

  it("aponta amplitude parcial e tronco inclinado com cue e confiança", () => {
    const titles = analysis.findings.map((finding) => finding.title);
    expect(titles).toContain("Amplitude parcial");
    expect(titles).toContain("Tronco muito inclinado");

    for (const finding of analysis.findings) {
      expect(finding.cue.length).toBeGreaterThan(10);
      expect(finding.detail).toMatch(/\d/);
      expect(["Alta", "Boa", "Limitada"]).toContain(finding.confidenceLabel);
      expect(finding.cycleIndex).toBeGreaterThanOrEqual(1);
      expect(finding.timestamp).toBeGreaterThanOrEqual(0);
    }
  });

  it("liga cada alerta a uma repetição existente", () => {
    const indexes = new Set(analysis.cycles.map((cycle) => cycle.index));
    for (const finding of analysis.findings) {
      expect(indexes.has(finding.cycleIndex)).toBe(true);
    }
  });
});

describe("movimento sem desvios", () => {
  it("retorna Movimento consistente quando nada excede as referências", () => {
    const frames = buildDemoFrames().map((frame) => frame);
    const clean = buildAnalysis({
      profile: getProfile("squat"),
      cameraView: "lateral",
      frames,
      durationSeconds: frames[frames.length - 1].time,
      sampledFrames: frames.length,
      validFrames: frames.length,
    });
    // A sequência de demonstração tem desvios propositais.
    expect(clean.findings.length).toBeGreaterThan(0);

    const perfect = buildAnalysis({
      profile: getProfile("squat"),
      cameraView: "frontal",
      frames: frames.map((frame) => ({ ...frame })),
      durationSeconds: frames[frames.length - 1].time,
      sampledFrames: frames.length,
      validFrames: frames.length,
    });
    const hasTorsoAlert = perfect.findings.some(
      (finding) => finding.title === "Tronco muito inclinado",
    );
    // A regra de tronco só vale na câmera lateral.
    expect(hasTorsoAlert).toBe(false);
  });
});

describe("microcopy de contagem", () => {
  it("concorda em número e substantivo", () => {
    expect(cycleCountLabel(getProfile("squat"), 1)).toBe(
      "1 repetição encontrada",
    );
    expect(cycleCountLabel(getProfile("squat"), 3)).toBe(
      "3 repetições encontradas",
    );
    expect(cycleCountLabel(getProfile("lunge"), 1)).toBe("1 passada encontrada");
    expect(cycleCountLabel(getProfile("lunge"), 3)).toBe(
      "3 passadas encontradas",
    );
  });

  it("pede passadas contínuas na mensagem de erro do afundo", () => {
    const message = getProfile("lunge").emptyCycleMessage;
    expect(message).toContain("Você não precisa voltar à posição neutra");
  });
});

describe("validação de upload", () => {
  const makeFile = (name: string, type: string, size: number) => {
    const file = new File(["0"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  it("aceita MP4, MOV e WebM dentro do limite", () => {
    expect(
      validateVideoFile(makeFile("treino.mp4", "video/mp4", 10_000_000)),
    ).toBeNull();
    expect(
      validateVideoFile(makeFile("treino.mov", "video/quicktime", 10_000)),
    ).toBeNull();
    expect(
      validateVideoFile(makeFile("treino.webm", "video/webm", 10_000)),
    ).toBeNull();
  });

  it("recusa arquivo que não é vídeo", () => {
    expect(
      validateVideoFile(makeFile("planilha.csv", "text/csv", 100))?.code,
    ).toBe("invalid-type");
  });

  it("recusa arquivo acima de 250 MB", () => {
    expect(
      validateVideoFile(makeFile("longo.mp4", "video/mp4", 260 * 1024 * 1024))
        ?.code,
    ).toBe("too-large");
  });

  it("recusa vídeo com mais de 45 segundos", () => {
    expect(validateDuration(46)?.code).toBe("too-long");
    expect(validateDuration(44)).toBeNull();
    expect(validateDuration(Number.NaN)?.code).toBe("unreadable");
  });
});
