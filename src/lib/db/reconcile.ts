import { EXERCISE_CATALOG } from "@/lib/catalog";
import type { Exercise } from "@/lib/types";

export type CatalogSource = "database" | "catalog";

export interface CatalogPayload {
  exercises: Exercise[];
  source: CatalogSource;
}

/**
 * O catálogo embutido é a fonte da verdade para vídeo e análise: correções feitas
 * em código precisam vencer linhas antigas persistidas no banco.
 */
export function reconcileWithCatalog(stored: Exercise[]): Exercise[] {
  const byId = new Map(stored.map((item) => [item.id, item]));
  const merged = EXERCISE_CATALOG.map((canonical) => {
    const row = byId.get(canonical.id);
    byId.delete(canonical.id);
    if (!row) return canonical;
    return {
      ...row,
      analyzable: canonical.analyzable,
      analysisProfile: canonical.analysisProfile,
      cameraView: canonical.cameraView,
      videoId: canonical.videoId,
      videoSource: canonical.videoSource,
      videoUrl: canonical.videoUrl,
      sortOrder: canonical.sortOrder,
      equipmentRequired: canonical.equipmentRequired,
      locationCompatible: canonical.locationCompatible,
      equipmentAlternatives: canonical.equipmentAlternatives,
    };
  });

  return [...merged, ...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}
