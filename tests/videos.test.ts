import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EXERCISE_CATALOG, youtubeThumbnail } from "@/lib/catalog";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) return sourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(entry) ? [fullPath] : [];
  });
}

describe("vídeos externos", () => {
  it("usa 23 vídeos reais e distintos do YouTube", () => {
    const ids = EXERCISE_CATALOG.map((exercise) => exercise.videoId);
    expect(new Set(ids).size).toBe(23);

    for (const exercise of EXERCISE_CATALOG) {
      expect(exercise.videoUrl).toBe(
        `https://www.youtube.com/watch?v=${exercise.videoId}`,
      );
      expect(exercise.videoId).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(exercise.videoSource.length).toBeGreaterThan(2);
    }
  });

  it("monta a miniatura a partir do id do vídeo", () => {
    expect(youtubeThumbnail("l83R5PblSMA")).toBe(
      "https://i.ytimg.com/vi/l83R5PblSMA/hqdefault.jpg",
    );
  });

  it("não incorpora players do YouTube em iframe", () => {
    const files = sourceFiles(path.resolve(process.cwd(), "src"));
    const offenders = files.filter((file) => {
      const content = readFileSync(file, "utf8");
      return /<iframe|youtube\.com\/embed/i.test(content);
    });
    expect(offenders).toEqual([]);
  });

  it("abre os vídeos em nova aba com rel seguro", () => {
    const files = sourceFiles(path.resolve(process.cwd(), "src"));
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (!content.includes('target="_blank"')) continue;
      expect(content, file).toContain('rel="noopener noreferrer"');
    }
  });
});
