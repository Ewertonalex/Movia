import { describe, expect, it } from "vitest";
import { buildDemoAnalysis } from "@/lib/analysis/demo";
import {
  isSavedAnalysis,
  toAnalysisResult,
  toSavedAnalysis,
} from "@/lib/analysis/history";

describe("histórico de análises", () => {
  it("grava o resultado sem landmarks nem vídeo", () => {
    const saved = toSavedAnalysis(buildDemoAnalysis());
    expect(saved.exerciseName).toBe("Agachamento");
    expect(saved.cycles.length).toBeGreaterThan(0);
    expect(saved.findings.length).toBeGreaterThan(0);
    expect(saved.consistency).toBeGreaterThan(0);
    expect("frames" in saved).toBe(false);
    expect(isSavedAnalysis(saved)).toBe(true);
  });

  it("reabre o resultado para a tela de análise", () => {
    const original = buildDemoAnalysis();
    const restored = toAnalysisResult(toSavedAnalysis(original));
    expect(restored.cycles).toEqual(original.cycles);
    expect(restored.findings).toEqual(original.findings);
    expect(restored.frames).toEqual([]);
    expect(restored.demo).toBe(true);
  });

  it("rejeita objetos que não são uma análise salva", () => {
    expect(isSavedAnalysis(null)).toBe(false);
    expect(isSavedAnalysis({ id: "x" })).toBe(false);
  });
});
