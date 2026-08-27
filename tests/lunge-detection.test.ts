import { describe, expect, it } from "vitest";
import {
  detectContinuousStrides,
  detectCycles,
  detectStationaryCycles,
  type AngleSample,
} from "@/lib/analysis/cycles";
import { movingAverage } from "@/lib/analysis/geometry";

const FPS = 10;

interface StrideSpec {
  top: number;
  bottom: number;
  seconds: number;
}

/**
 * Simula um afundo caminhando: o joelho nunca volta a 158° e cada passada
 * termina em um lugar diferente, como acontece no deslocamento real.
 */
function walkingLungeSeries(strides: StrideSpec[]): AngleSample[] {
  const samples: AngleSample[] = [];
  let time = 0;

  for (const stride of strides) {
    const total = Math.round(stride.seconds * FPS);
    for (let i = 0; i < total; i += 1) {
      const phase = Math.sin((Math.PI * i) / total) ** 2;
      samples.push({
        time: Number(time.toFixed(2)),
        angle: stride.top - (stride.top - stride.bottom) * phase,
      });
      time += 1 / FPS;
    }
  }

  return samples.map((sample, index) => ({
    time: sample.time,
    angle: movingAverage(
      samples.map((item) => item.angle),
      2,
    )[index],
  }));
}

describe("detecção de passadas do afundo caminhando", () => {
  const series = walkingLungeSeries([
    { top: 148, bottom: 96, seconds: 1.2 },
    { top: 144, bottom: 92, seconds: 1.3 },
    { top: 146, bottom: 99, seconds: 1.2 },
    { top: 142, bottom: 94, seconds: 1.3 },
  ]);

  it("reconhece cada passada sem exigir retorno à posição neutra", () => {
    expect(Math.max(...series.map((sample) => sample.angle))).toBeLessThan(158);
    const strides = detectContinuousStrides(series);
    expect(strides).toHaveLength(4);
  });

  it("entrega passadas em ordem, com duração plausível", () => {
    const strides = detectContinuousStrides(series);
    for (let i = 0; i < strides.length; i += 1) {
      expect(strides[i].duration).toBeGreaterThanOrEqual(0.45);
      expect(strides[i].duration).toBeLessThanOrEqual(4);
      expect(strides[i].minAngle).toBeLessThan(110);
      if (i > 0) {
        expect(strides[i].bottomTime).toBeGreaterThan(strides[i - 1].bottomTime);
      }
    }
  });

  it("a máquina de estados estacionária não encontraria nada nessa série", () => {
    expect(detectStationaryCycles(series, "squat")).toHaveLength(0);
  });

  it("é acionada pelo perfil lunge em detectCycles", () => {
    expect(detectCycles(series, "lunge")).toHaveLength(4);
  });

  it("descarta séries sem amplitude suficiente", () => {
    const flat = walkingLungeSeries([
      { top: 150, bottom: 144, seconds: 1.2 },
      { top: 149, bottom: 145, seconds: 1.2 },
    ]);
    expect(detectContinuousStrides(flat)).toHaveLength(0);
  });

  it("não conta oscilações rápidas como passadas separadas", () => {
    const jitter = walkingLungeSeries([
      { top: 146, bottom: 95, seconds: 1.2 },
      { top: 130, bottom: 122, seconds: 0.3 },
      { top: 145, bottom: 96, seconds: 1.2 },
    ]);
    expect(detectContinuousStrides(jitter).length).toBeLessThanOrEqual(2);
  });

  it("limita o resultado a 20 passadas", () => {
    const many = walkingLungeSeries(
      Array.from({ length: 26 }, () => ({
        top: 146,
        bottom: 95,
        seconds: 1.2,
      })),
    );
    expect(detectContinuousStrides(many)).toHaveLength(20);
  });
});

describe("detecção de repetições estacionárias", () => {
  function stationarySeries(
    reps: number,
    top: number,
    bottom: number,
  ): AngleSample[] {
    const samples: AngleSample[] = [];
    let time = 0;
    const push = (angle: number) => {
      samples.push({ time: Number(time.toFixed(2)), angle });
      time += 1 / FPS;
    };

    for (let i = 0; i < 5; i += 1) push(top);
    for (let rep = 0; rep < reps; rep += 1) {
      const total = 12;
      for (let i = 0; i <= total; i += 1) {
        const phase = Math.sin((Math.PI * i) / total) ** 2;
        push(top - (top - bottom) * phase);
      }
      for (let i = 0; i < 4; i += 1) push(top);
    }
    return samples;
  }

  it("conta repetições de agachamento com retorno ao topo", () => {
    const cycles = detectStationaryCycles(stationarySeries(5, 172, 96), "squat");
    expect(cycles).toHaveLength(5);
    expect(cycles[0].duration).toBeGreaterThanOrEqual(0.65);
  });

  it("ignora movimento que não passa do limiar de descida", () => {
    const cycles = detectStationaryCycles(
      stationarySeries(4, 172, 140),
      "squat",
    );
    expect(cycles).toHaveLength(0);
  });

  it("usa limiares próprios de flexão e rosca", () => {
    expect(
      detectStationaryCycles(stationarySeries(3, 165, 100), "pushup"),
    ).toHaveLength(3);
    expect(
      detectStationaryCycles(stationarySeries(3, 150, 80), "curl"),
    ).toHaveLength(3);
  });
});
